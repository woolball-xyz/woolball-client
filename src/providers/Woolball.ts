import { verifyBrowserCompatibility } from "../utils";
import { WebSocketMessage, WorkerEvent } from "../utils/websocket";
import Worker from 'web-worker';
import { TaskType, taskProcessors } from '../utils/tasks';
import { Environment, TASK_CONFIGS, getTaskExecutionType, getTaskHandler } from './TaskAvailability';

type TaskStatus = 'started' | 'success' | 'error' | 'node_count';

type TaskEventData = {
    id: string;
    type: string;
    status: TaskStatus;
    nodeCount?: number;
};

type EventListener = (data: TaskEventData) => void;

interface WoolballOptions {
    environment?: Environment;
}





class Woolball {
    private wsConnection: WebSocket | null = null;
    private clientId: string;
    private eventListeners: Map<TaskStatus, Set<EventListener>> = new Map();
    private workerTypes: Map<string, string | Function>;
    private wsUrl: string;
    private activeWorkers: Set<Worker>;
    private options: WoolballOptions;

    constructor(id : string, url = 'ws://localhost:9003/ws', options: WoolballOptions = {}) {
        this.options = options;
        
        // Definir ambiente padrão como 'browser' se não for especificado
        if (!this.options.environment) {
            this.options.environment = 'browser' as Environment;
        }
        
        if (['browser', 'extension'].includes(this.options.environment)) {
            verifyBrowserCompatibility();
        }
        this.clientId = id;
        this.wsUrl = url;
        this.eventListeners.set('started', new Set());
        this.eventListeners.set('success', new Set());
        this.eventListeners.set('error', new Set());
        this.eventListeners.set('node_count', new Set());
        this.workerTypes = new Map();
        this.activeWorkers = new Set();
        
        // Initialize worker types based on task configurations
        Object.keys(TASK_CONFIGS).forEach((taskType) => {
            const handler = getTaskHandler(taskType as TaskType, this.getCurrentEnvironment());
            if (handler) {
                this.workerTypes.set(taskType, handler);
            }
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

    public setWorkerSource(type: string, source: string | Function): void {
        this.workerTypes.set(type, source);
    }

    private createWorker(type: string): Worker {
        const workerSource = this.workerTypes.get(type);
        if (!workerSource) {
            throw new Error(`Worker type not found: ${type}`);
        }

        try {
            const blob = new Blob([workerSource as string], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            
            const worker = new Worker(workerUrl);
            URL.revokeObjectURL(workerUrl);
            
            this.activeWorkers.add(worker);
            return worker;
        } catch (error: any) {
            console.error('Error creating worker:', error);
            throw new Error(`Failed to create worker: ${error.message || 'Unknown error'}`);
        }
    }
    
    /**
     * Gets the current environment based on options or detection
     * @returns The current environment
     */
    private getCurrentEnvironment(): Environment {
        if (this.options.environment) {
            return this.options.environment;
        } else if (typeof window !== 'undefined') {
            return 'browser';
        } else if (typeof process !== 'undefined' && process.versions && process.versions.node) {
            return 'node';
        } else {
            // Fallback, though this should not happen in normal circumstances
            console.warn('Could not determine environment, defaulting to node');
            return 'node';
        }
    }

    private terminateWorker(worker: Worker & { _blobUrl?: string }): void {
        worker.terminate();
        if (worker._blobUrl) {
            URL.revokeObjectURL(worker._blobUrl);
            delete worker._blobUrl;
        }
        this.activeWorkers.delete(worker);
    }

    public async processEvent(type : string, value: any): Promise<any> {
        // Convert string boolean values to actual booleans
        for (const key in value) {
            if (value[key] === 'true') {
                value[key] = true;
            }
            if (value[key] === 'false') {
                value[key] = false;
            }
        }
        
        const currentEnvironment = this.getCurrentEnvironment();
        const executionType = getTaskExecutionType(type as TaskType, currentEnvironment);
        
        if (!executionType) {
            return { error: `Task type '${type}' is not supported in ${currentEnvironment} environment` };
        }
        
        // Handle tasks based on their execution type
        switch (executionType) {
            case 'browser':
                try {
                    const handler = getTaskHandler(type as TaskType, currentEnvironment) as Function;
                    const result = await handler(value);
                    return result;
                } catch (processorError) {
                    console.error(`[Browser] Error in ${type} processor:`, processorError);
                    const errorMessage = processorError instanceof Error ? processorError.message : String(processorError);
                    return { error: errorMessage };
                }
                
            case 'node_worker': {
                // Validate provider type for Node.js (keep existing validation)
                if (value.provider && value.provider !== 'transformers') {
                    throw new Error(`Unsupported provider for Node.js: ${value.provider}. Only 'transformers' is supported.`);
                }
                
                const { processWithoutNodeWorker } = await import('./node-worker.js');
                return processWithoutNodeWorker(type as TaskType, value);
            }
                
            case 'worker':
                const worker = this.createWorker(type);

                return new Promise((resolve, reject) => {
                    const messageHandler = (e: MessageEvent) => {
                        worker.removeEventListener('message', messageHandler);
                        worker.removeEventListener('error', errorHandler);
                        this.terminateWorker(worker);
                        
                        if (e.data.error) {
                            resolve({ error: e.data.error });
                        } else {
                            resolve(e.data);
                        }
                    };

                    const errorHandler = (e: ErrorEvent) => {
                        worker.removeEventListener('message', messageHandler);
                        worker.removeEventListener('error', errorHandler);
                        this.terminateWorker(worker);
                        
                        const errorMessage = e.message || 'Unknown worker error';
                        resolve({ error: errorMessage });
                    };

                    worker.addEventListener('message', messageHandler);
                    worker.addEventListener('error', errorHandler);
                    worker.postMessage(value);
                });
                
            default:
                return { error: `Unknown execution type: ${executionType}` };
        }
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
