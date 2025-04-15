import { verifyBrowserCompatibility } from "../utils";

type WorkerEvent = {
    key: string;
    value: string;
};

class Woolball {
    private workers: Map<string, Worker>;

    constructor() {
        verifyBrowserCompatibility();
        this.workers = new Map();
        this.registerWorkers();
    }

    private registerWorkers() {
        try {
            // Usando o caminho para o worker compilado pelo script build-worker.js
            // Este arquivo é gerado durante o build e está disponível em dist/
            if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
                // Caminho para o worker compilado
                const workerPath = '/dist/worker-speech-to-text.js';
                const speechToTextWorker = new Worker(workerPath);
                this.workers.set('speech-to-text', speechToTextWorker);
            } else {
                throw new Error('Ambiente não suportado para Web Workers');
            }
        } catch (error) {
            console.error('Erro ao registrar worker:', error);
        }
    }

    public async processEvent(event: WorkerEvent): Promise<any> {
        const worker = this.workers.get(event.key);
        if (!worker) {
            throw new Error(`Worker not found for key: ${event.key}`);
        }

        return new Promise((resolve, reject) => {
            const messageHandler = (e: MessageEvent) => {
                worker.removeEventListener('message', messageHandler);
                worker.removeEventListener('error', errorHandler);
                resolve(JSON.parse(e.data));
            };

            const errorHandler = (error: ErrorEvent) => {
                worker.removeEventListener('message', messageHandler);
                worker.removeEventListener('error', errorHandler);
                reject(error);
            };

            worker.addEventListener('message', messageHandler);
            worker.addEventListener('error', errorHandler);
            worker.postMessage(event.value);
        });
    }
}

export default Woolball;