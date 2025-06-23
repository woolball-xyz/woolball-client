import { verifyBrowserCompatibility } from "../utils";
import { WebSocketMessage, WorkerEvent } from "../utils/websocket";
import Worker from 'web-worker';
import workerCode from './worker-string';
import { taskProcessors } from '../utils/tasks';


type TaskStatus = 'started' | 'success' | 'error' | 'node_count';

type TaskEventData = {
    id: string;
    type: string;
    status: TaskStatus;
    nodeCount?: number;
};

type EventListener = (data: TaskEventData) => void;

type TaskConfig = {
    type: 'worker' | 'browser';
    handler: string | Function;
};

const TASK_CONFIGS: Record<string, TaskConfig> = {
    'automatic-speech-recognition': { type: 'worker', handler: workerCode },
    'text-to-speech': { type: 'worker', handler: workerCode },
    'translation': { type: 'worker', handler: workerCode },
    'text-generation': { type: 'worker', handler: workerCode },
    'image-text-to-text': { type: 'worker', handler: workerCode },
    'char-to-image': { type: 'browser', handler: taskProcessors['char-to-image'] },
    'html-to-image': { type: 'browser', handler: taskProcessors['html-to-image'] },
};

class Woolball {
    private wsConnection: WebSocket | null = null;
    private clientId: string;
    private eventListeners: Map<TaskStatus, Set<EventListener>> = new Map();
    private workerTypes: Map<string, string | Function>;
    private wsUrl: string;
    private activeWorkers: Set<Worker>;

    constructor(id : string, url = 'ws://localhost:9003/ws') {
        verifyBrowserCompatibility();
        this.clientId = id;
        this.wsUrl = url;
        this.eventListeners.set('started', new Set());
        this.eventListeners.set('success', new Set());
        this.eventListeners.set('error', new Set());
        this.eventListeners.set('node_count', new Set());
        this.workerTypes = new Map();
        this.activeWorkers = new Set();
        
        Object.entries(TASK_CONFIGS).forEach(([taskType, config]) => {
            this.workerTypes.set(taskType, config.handler);
        });
    }

    public start(): void {
        if (this.wsConnection) {
            console.warn('WebSocket connection already exists');
            return;
        }
        this.connectWebSocket(this.wsUrl);
    }

    public destroy(): void {
        if (this.wsConnection) {
            this.wsConnection.close();
            this.wsConnection = null;
        }
        
        this.activeWorkers.forEach(worker => {
            worker.terminate();
        });
        this.activeWorkers.clear();
        
        this.eventListeners.clear();
        this.eventListeners.set('started', new Set());
        this.eventListeners.set('success', new Set());
        this.eventListeners.set('error', new Set());
        this.eventListeners.set('node_count', new Set());
        
        this.workerTypes.clear();
    }
    
    /**
     * Establishes WebSocket connection and sets up message handlers
     */
    private connectWebSocket(url: string): void {
        this.wsConnection = new WebSocket(`${url}/${this.clientId}`);
        this.wsConnection.onopen = () => {
            console.log('WebSocket connection established');
        };
        this.wsConnection.onmessage = (event) => {
            if (event.data === 'ping') {
                return;
            }

            if (event.data.startsWith('node_count:')) {
                const nodeCountStr = event.data.split(':')[1];
                const nodeCount = parseInt(nodeCountStr, 10);
                
                if (!isNaN(nodeCount)) {
                    this.emitEvent('node_count', {
                        id: '',
                        type: 'node_count',
                        status: 'node_count',
                        nodeCount: nodeCount
                    });
                }
                return;
            }
            try {
                this.handleWebSocketMessage(JSON.parse(event.data));
            } catch (parseError) {
                console.error('Failed to parse WebSocket message:', parseError);
                console.error('Raw message:', event.data);
            }
        };
        this.wsConnection.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        this.wsConnection.onclose = (event) => {
            console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        };
    }
    
    /**
     * Handles incoming WebSocket messages
     */
    private async handleWebSocketMessage(message: WorkerEvent): Promise<void> {
        const { Id, Key, Value } = message;
        if (!Id || !Key || !Value) {
            console.error('Invalid message format:', message);
            return;
        }
        
        try {         
            this.emitEvent('started', {
                id: Id,
                type: Key,
                status: 'started'
            });
            
             
            const response = await this.processEvent(Key, Value);
            
            if(response.error) {
                
                const errorData = {
                    id: Id,
                    type: Key,
                    status: 'error' as TaskStatus,
                };

                console.error(`Error processing ${Key}:`, response.error);
                
                this.emitEvent('error', errorData);
                
                this.sendWebSocketMessage({
                    type: 'ERROR',
                    data: {
                        requestId: Id,
                        error: response.error,
                    }
                });
                return;
            }

            this.emitEvent('success', {
                id: Id,
                type: Key,
                status: 'success',
            });

            this.sendWebSocketMessage({
                type: 'PROCESS_RESULT',
                data: {
                    requestId: Id, 
                    response
                }
            });
            
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
            this.sendWebSocketMessage({
                type: 'ERROR',
                data: {
                    requestId: Id, 
                    error: error instanceof Error ? error.message : 'Unknown error',
                }
            });
        }
    }
    
    /**
     * Sends a message to the WebSocket server
     */
    private sendWebSocketMessage(message: WebSocketMessage): boolean {
        if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
            this.wsConnection.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    private createWorker(type: string): Worker {
        if (typeof window === 'undefined') {
            throw new Error('Environment not supported for Web Workers');
        }

        const workerCode = this.workerTypes.get(type);
        if (!workerCode) {
            throw new Error(`Worker type not found: ${type}`);
        }

        if (typeof workerCode !== 'string') {
            throw new Error(`Cannot create worker for browser task: ${type}`);
        }

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);
        
        worker.addEventListener('error', (err) => {
            console.error('Worker error:', err);
        });
        
        this.activeWorkers.add(worker);
        return worker;
    }

    private terminateWorker(worker: Worker): void {
        worker.terminate();
        this.activeWorkers.delete(worker);
    }

    public async processEvent(type : string, value: any): Promise<any> {
        const taskConfig = TASK_CONFIGS[type];
        if (!taskConfig) {
            throw new Error(`Task type not found: ${type}`);
        }

        for (const key in value) {
            if (value[key] === 'true') {
                value[key] = true;
            }
            if (value[key] === 'false') {
                value[key] = false;
            }
        }

        if (taskConfig.type === 'browser') {
            try {
                const result = await (taskConfig.handler as Function)(value);
                return result;
            } catch (processorError) {
                console.error(`[Browser] Error in ${type} processor:`, processorError);
                const errorMessage = processorError instanceof Error ? processorError.message : String(processorError);
                return { error: errorMessage };
            }
        }

        const worker = this.createWorker(type);

        return new Promise((resolve, reject) => {
            const messageHandler = (e: MessageEvent) => {
                worker.removeEventListener('message', messageHandler);
                worker.removeEventListener('error', errorHandler);
                this.terminateWorker(worker);
                
                if (e.data.error) {
                    console.error(`Worker ${type} error:`, e.data.error);
                }
                
                resolve(e.data);
            };

            const errorHandler = (error: ErrorEvent) => {
                console.error(`Worker ${type} execution error:`, error);
                worker.removeEventListener('message', messageHandler);
                worker.removeEventListener('error', errorHandler);
                this.terminateWorker(worker);
                reject(error);
            };

            worker.addEventListener('message', messageHandler);
            worker.addEventListener('error', errorHandler);
            
            console.log(`Sending data to worker ${type}:`, value);
            
            worker.postMessage({ task: type, ...value });
        });
    }

    public on(status: TaskStatus, listener: EventListener): void {
        const listeners = this.eventListeners.get(status);
        if (listeners) {
            listeners.add(listener);
        }
    }

    public off(status: TaskStatus, listener: EventListener): void {
        const listeners = this.eventListeners.get(status);
        if (listeners) {
            listeners.delete(listener);
        }
    }

    private emitEvent(status: TaskStatus, data: TaskEventData): void {
        const listeners = this.eventListeners.get(status);
        if (listeners) {
            listeners.forEach(listener => listener(data));
        }
    }
}

export default Woolball;
