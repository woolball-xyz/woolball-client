import { verifyBrowserCompatibility } from "../utils";
import { WebSocketMessage, WorkerEvent } from "../utils/websocket";
import Worker from 'web-worker';
import workerCode from './worker-string';
import { isBrowserTask, process as processBrowserTask } from './browser';


type TaskStatus = 'started' | 'success' | 'error' | 'node_count';

type TaskEventData = {
    id: string;
    type: string;
    status: TaskStatus;
    nodeCount?: number; // Optional field for node count events
};

type EventListener = (data: TaskEventData) => void;

class Woolball {
    private wsConnection: WebSocket | null = null;
    private clientId: string;
    private eventListeners: Map<TaskStatus, Set<EventListener>> = new Map();
    private workerTypes: Map<string, string>;
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
        
        // Register available worker types
        this.workerTypes.set('automatic-speech-recognition', workerCode);
        this.workerTypes.set('text-to-speech', workerCode);
        this.workerTypes.set('translation', workerCode);
        this.workerTypes.set('text-generation', workerCode);
        this.workerTypes.set('music-generation', workerCode);
        this.workerTypes.set('image-text-to-text', workerCode);
    }

    public start(): void {
        if (this.wsConnection) {
            console.warn('WebSocket connection already exists');
            return;
        }
        this.connectWebSocket(this.wsUrl);
    }

    public destroy(): void {
        // Close WebSocket connection if it exists
        if (this.wsConnection) {
            this.wsConnection.close();
            this.wsConnection = null;
        }

        // Terminate all active workers
        this.activeWorkers.forEach(worker => {
            worker.terminate();
        });
        this.activeWorkers.clear();

        // Clear all event listeners
        this.eventListeners.clear();
        this.eventListeners.set('started', new Set());
        this.eventListeners.set('success', new Set());
        this.eventListeners.set('error', new Set());
        this.eventListeners.set('node_count', new Set());

        // Clear worker types
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

             // Check if this is a node_count event
            if (event.data .startsWith('node_count:')) {
                const nodeCountStr = event.data .split(':')[1];
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
            this.handleWebSocketMessage(JSON.parse(event.data));
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

                // Show detailed errors in main console
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

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);
        
        // Add error listener to capture worker errors
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
        if (isBrowserTask(type)) {
            return processBrowserTask({ data: { task: type, ...value } });
        }
        const worker = this.createWorker(type);

        return new Promise((resolve, reject) => {
            const messageHandler = (e: MessageEvent) => {
                worker.removeEventListener('message', messageHandler);
                worker.removeEventListener('error', errorHandler);
                this.terminateWorker(worker);
                
                // Log worker response for debugging
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
            
            // Debug log
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