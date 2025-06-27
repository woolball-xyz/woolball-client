import { asr } from './ai/asr';
import { tts } from './ai/tts';
import { translation } from './ai/translation';
import { textGeneration } from './ai/text-generation';
// import { imageGeneration } from './ai/browser/image-generation';

import { imageTextToText } from './ai/image-text-to-text';

import { TaskType, TaskData, TaskResult, TaskProcessor } from './types';

const createDomTaskLoader = (taskPath: string) => {
  return async (data: TaskData): Promise<TaskResult> => {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('DOM not available in this environment');
      }
      
      const module = await import(taskPath);
      const taskFunction = module.default || Object.values(module)[0];
      return taskFunction(data);
    } catch (error) {
      console.warn(`Failed to load DOM-dependent task: ${error instanceof Error ? error.message : String(error)}`);
      return { error: 'This task requires DOM access which is not available in this environment' };
    }
  };
};

export const taskProcessors: Record<TaskType, TaskProcessor> = {
  'automatic-speech-recognition': asr,
  'text-to-speech': tts,
  'translation': translation,
  'text-generation': textGeneration,
  'image-text-to-text': imageTextToText,
  'char-to-image': createDomTaskLoader('./browser/canvas/char-to-image'),
  'html-to-image': createDomTaskLoader('./browser/canvas/html-to-image'),
};

export type { TaskType, TaskData, TaskResult, TaskProcessor };

export { asr, tts, translation, textGeneration, imageTextToText };

export const charToImage = createDomTaskLoader('./browser/canvas/char-to-image');
export const htmlToImage = createDomTaskLoader('./browser/canvas/html-to-image');