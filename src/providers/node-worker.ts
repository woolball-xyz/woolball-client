import { TaskType, taskProcessors } from '../utils/tasks';

// Definições de tipos para worker_threads
type NodeWorker = any;
type NodeWorkerOptions = any;

// Variáveis para armazenar os módulos importados dinamicamente
let Worker: any;
let path: any;
let fs: any;

// Função para verificar se estamos em ambiente Node.js
function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && 
         process.versions != null && 
         process.versions.node != null;
}

// Função para carregar os módulos Node.js sob demanda
async function loadNodeModules() {
  // Se não estamos em um ambiente Node.js, retorna false imediatamente
  if (!isNodeEnvironment()) {
    console.log('Não estamos em um ambiente Node.js, pulando carregamento de módulos Node.js');
    return false;
  }
  
  try {
    // Importações dinâmicas para módulos Node.js
    // Usamos uma abordagem que evita que o bundler tente resolver essas importações
    // durante o build para browser
    console.log('Tentando carregar worker_threads');
    const workerThreadsImport = new Function('return import("node:worker_threads")');
    const workerThreads = await workerThreadsImport();
    Worker = workerThreads.Worker;
    
    console.log('Tentando carregar path');
    const pathImport = new Function('return import("node:path")');
    const pathModule = await pathImport();
    path = pathModule.default;
    
    console.log('Tentando carregar fs');
    const fsImport = new Function('return import("node:fs")');
    const fsModule = await fsImport();
    fs = fsModule.default;
    
    console.log('Todos os módulos Node.js carregados com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao carregar módulos Node.js:', error);
    return false;
  }
}

/**
 * Creates a Node.js worker thread from the worker code
 * @param workerCode The worker code as a string
 * @returns A Promise that resolves with the worker thread
 */
export async function createNodeWorker(workerCode: string): Promise<NodeWorker> {
  const isNode = await loadNodeModules();
  if (!isNode) {
    console.warn('Cannot create Node.js worker in non-Node environment');
    throw new Error('Cannot create Node.js worker in non-Node environment');
  }

  // Create a temporary file to store the worker code
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const tempFile = path.join(tempDir, `worker-${Date.now()}.js`);
  fs.writeFileSync(tempFile, workerCode);
  
  const worker = new Worker(tempFile);
  
  // Clean up the temporary file when the worker is done
  worker.on('exit', () => {
    try {
      fs.unlinkSync(tempFile);
    } catch (error) {
      console.error('Error cleaning up temporary worker file:', error);
    }
  });
  
  return worker;
}

/**
 * Process a task using a Node.js worker thread
 * @param type The task type
 * @param workerCode The worker code as a string
 * @param data The task data
 * @returns A Promise that resolves with the task result
 */
// 😢 Error processing text-generation: Cannot read properties of undefined (reading 'create')
export function processWithNodeWorker(type: TaskType, workerCode: string, data: any): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      // Verifica se estamos em ambiente Node.js
      if (!isNodeEnvironment()) {
        return resolve({ error: 'Node.js environment is required for this task' });
      }

      // Cria o worker de forma assíncrona
      const worker = await createNodeWorker(workerCode);
      
      worker.on('message', (result : any) => {
        worker.terminate();
        resolve(result);
      });
      
      worker.on('error', (error : any) => {
        worker.terminate();
        const errorMessage = error.message || 'Unknown worker error';
        resolve({ error: errorMessage });
      });
      
      worker.on('exit', (code : any) => {
        if (code !== 0) {
          resolve({ error: `Worker stopped with exit code ${code}` });
        }
      });
      
      // Add the task type to the data
      const taskData = { task: type, ...data };
      worker.postMessage(taskData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      resolve({ error: errorMessage });
    }
  });
}

/**
 * Process a task directly without using a Node.js worker thread
 * @param type The task type
 * @param data The task data
 * @returns A Promise that resolves with the task result
 */
export function processWithoutNodeWorker(type: TaskType, data: any): Promise<any> {
  return new Promise(async (resolve) => {
    try {
      // Verifica se o tipo de tarefa existe
      const processor = taskProcessors[type];
      if (!processor) {
        return resolve({ error: `Unsupported task: ${type}` });
      }
      // Executa o processador diretamente
      const result = await processor(data);
      resolve(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      resolve({ error: errorMessage });
    }
  });
}