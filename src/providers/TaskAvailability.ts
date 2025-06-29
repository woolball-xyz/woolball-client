import { TaskType, TaskProcessor, taskProcessors } from '../utils/tasks';
import workerCode from './worker-string';

export type Environment = 'browser' | 'extension' | 'node';

export type ExecutionType = 'browser' | 'worker' | 'node_worker';

export interface TaskConfig {
  browser?: {
    type: ExecutionType;
    handler: string | Function;
  };
  extension?: {
    type: ExecutionType;
    handler: string | Function;
  };
  node?: {
    type: ExecutionType;
    handler: string | Function;
  };
}

// AI tasks: automatic-speech-recognition, text-to-speech, translation, text-generation, image-text-to-text
// Canvas tasks: char-to-image, html-to-image

/**
 * Centralized task configuration following the rules:
 * - Browser: AI tasks via worker, canvas tasks direct
 * - Extension: AI tasks direct, canvas tasks unavailable
 * - Node: AI tasks via node_worker, canvas tasks unavailable
 */
export const TASK_CONFIGS: Record<TaskType, TaskConfig> = {
  // AI Tasks
  'automatic-speech-recognition': {
    browser: { type: 'worker', handler: workerCode },
    extension: { type: 'browser', handler: taskProcessors['automatic-speech-recognition'] },
    node: { type: 'node_worker', handler: taskProcessors['automatic-speech-recognition'] }
  },
  'text-to-speech': {
    browser: { type: 'worker', handler: workerCode },
    extension: { type: 'browser', handler: taskProcessors['text-to-speech'] },
    node: { type: 'node_worker', handler: taskProcessors['text-to-speech'] }
  },
  'translation': {
    browser: { type: 'worker', handler: workerCode },
    extension: { type: 'browser', handler: taskProcessors['translation'] },
    node: { type: 'node_worker', handler: taskProcessors['translation'] }
  },
  'text-generation': {
    browser: { type: 'worker', handler: workerCode },
    extension: { type: 'browser', handler: taskProcessors['text-generation'] },
    node: { type: 'node_worker', handler: taskProcessors['text-generation'] }
  },
  'image-text-to-text': {
    browser: { type: 'worker', handler: workerCode },
    extension: { type: 'browser', handler: taskProcessors['image-text-to-text'] },
    node: { type: 'node_worker', handler: taskProcessors['image-text-to-text'] }
  },
  // Canvas Tasks
  'char-to-image': {
    browser: { type: 'browser', handler: taskProcessors['char-to-image'] }
    // Not available in extension and node
  },
  'html-to-image': {
    browser: { type: 'browser', handler: taskProcessors['html-to-image'] }
    // Not available in extension and node
  },
};

/**
 * Check if a task is available in the given environment
 */
export function isTaskAvailableInEnvironment(taskType: TaskType, environment: Environment): boolean {
  const config = TASK_CONFIGS[taskType];
  return config ? config[environment] !== undefined : false;
}

/**
 * Get the task handler for a specific task type and environment
 */
export function getTaskHandler(taskType: TaskType, environment: Environment): string | Function | null {
  const config = TASK_CONFIGS[taskType];
  if (!config || !config[environment]) {
    return null;
  }
  
  return config[environment]!.handler;
}

/**
 * Get the execution type for a task in a specific environment
 */
export function getTaskExecutionType(taskType: TaskType, environment: Environment): ExecutionType | null {
  const config = TASK_CONFIGS[taskType];
  if (!config || !config[environment]) {
    return null;
  }
  
  return config[environment]!.type;
}