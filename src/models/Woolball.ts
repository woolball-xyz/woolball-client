import { verifyBrowserCompatibility } from "../utils";
import { WebSocketMessage, WorkerEvent } from "../utils/websocket";



type TaskStatus = 'started' | 'success' | 'error';

type TaskEventData = {
    id: string;
    type: string;
    status: TaskStatus;
};

type EventListener = (data: TaskEventData) => void;

class Woolball {
    private workers: Map<string, Worker>;
    private wsConnection: WebSocket | null = null;
    private clientId: string;
    private eventListeners: Map<TaskStatus, Set<EventListener>> = new Map();

    constructor(id : string, url = 'ws://localhost:9003/ws') {
        verifyBrowserCompatibility();
        this.workers = new Map();
        this.clientId = id;
        this.eventListeners.set('started', new Set());
        this.eventListeners.set('success', new Set());
        this.eventListeners.set('error', new Set());
        this.registerWorkers();

        //validate available models, talk with Alex (mrs pizzas)

        this.connectWebSocket(url);
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
        }
        return false;
    }

    private registerWorkers() {
        try {
            if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
                const workerPath = '/dist/worker-speech-to-text.js';
                const speechToTextWorker = new Worker(workerPath);
                this.workers.set('speech-recognition', speechToTextWorker);

                console.log('Worker registrado com sucesso!');
            } else {
                throw new Error('Ambiente não suportado para Web Workers');
            }
        } catch (error) {
            console.error('Erro ao registrar worker:', error);
        }
    }

    public async processEvent(type : string, value: any): Promise<any> {
        const worker = this.workers.get(type);
        if (!worker) {
            throw new Error(`Worker not found for key: ${type}`);
        }

        return new Promise((resolve, reject) => {
            const messageHandler = (e: MessageEvent) => {
                worker.removeEventListener('message', messageHandler);
                worker.removeEventListener('error', errorHandler);
                resolve(e.data);
            };

            const errorHandler = (error: ErrorEvent) => {
                worker.removeEventListener('message', messageHandler);
                worker.removeEventListener('error', errorHandler);
                reject(error);
            };

            worker.addEventListener('message', messageHandler);
            worker.addEventListener('error', errorHandler);
            worker.postMessage(value);
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