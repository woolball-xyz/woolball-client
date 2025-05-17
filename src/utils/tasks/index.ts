import { asr } from './asr';
import { tts } from './tts';
import { translation } from './translation';
import { textGeneration } from './text-generation';
import { TaskType, TaskData, TaskResult, TaskProcessor } from './types';

export const taskProcessors: Record<TaskType, TaskProcessor> = {
  'automatic-speech-recognition': asr,
  'text-to-speech': tts,
  'translation': translation,
  'text-generation': textGeneration
};

export type { TaskType, TaskData, TaskResult, TaskProcessor };

export { asr, tts, translation, textGeneration }; 