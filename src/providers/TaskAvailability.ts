import { TaskType, TaskProcessor, taskProcessors } from '../utils/tasks';
import workerCode from './worker-string';

export type Environment = 'web' | 'extension' | 'node';

export type ExecutionType = 'worker' | 'browser' | 'direct';

export interface TaskConfig {
  type: ExecutionType;
  handler: string | Function;
  availableIn: Environment[];
}

/**
 * This configuration defines how each task type should be executed in different environments.
 * - type: How the task should be executed (worker, browser, or direct)
 * - handler: The function or code to handle the task
 * - availableIn: List of environments where this task is available
 */
export const TASK_CONFIGS: Record<TaskType, TaskConfig> = {
  'automatic-speech-recognition': { 
    type: 'worker', 
    handler: workerCode, 
    availableIn: ['web', 'extension']
  },
  'text-to-speech': { 
    type: 'worker', 
    handler: workerCode, 
    availableIn: ['web', 'extension']
  },
  'translation': { 
    type: 'worker', 
    handler: workerCode, 
    availableIn: ['web', 'extension']
  },
  'text-generation': { 
    type: 'worker', 
    handler: workerCode, 
    availableIn: ['web', 'extension']
  },
  'image-text-to-text': { 
    type: 'worker', 
    handler: workerCode, 
    availableIn: ['web', 'extension']
  },
  'char-to-image': { 
    type: 'browser', 
    handler: taskProcessors['char-to-image'], 
    availableIn: ['web']
  },
  'html-to-image': { 
    type: 'browser', 
    handler: taskProcessors['html-to-image'], 
    availableIn: ['web']
  },
};

/**
 * Checks if a task is available in the specified environment
 * @param taskType The type of task to check
 * @param environment The current environment
 * @returns True if the task is available in the environment
 */
export function isTaskAvailableInEnvironment(taskType: TaskType, environment: Environment): boolean {
  const config = TASK_CONFIGS[taskType];
  if (!config) return false;
  return config.availableIn.includes(environment);
}

/**
 * Gets the appropriate handler for a task in the current environment
 * @param taskType The type of task
 * @param environment The current environment
 * @returns The handler function or code, or null if not available
 */
export function getTaskHandler(taskType: TaskType, environment: Environment): string | Function | null {
  if (!isTaskAvailableInEnvironment(taskType, environment)) {
    return null;
  }
  
  const config = TASK_CONFIGS[taskType];
  
  // For extension environment, we always use the direct processor
  if (environment === 'extension') {
    return taskProcessors[taskType];
  }
  
  return config.handler;
}

/**
 * Gets the execution type for a task in the current environment
 * @param taskType The type of task
 * @param environment The current environment
 * @returns The execution type, or null if not available
 */
export function getTaskExecutionType(taskType: TaskType, environment: Environment): ExecutionType | null {
  if (!isTaskAvailableInEnvironment(taskType, environment)) {
    return null;
  }
  
  const config = TASK_CONFIGS[taskType];
  
  // For extension environment, we always use direct execution
  if (environment === 'extension') {
    return 'direct';
  }
  
  return config.type;
}