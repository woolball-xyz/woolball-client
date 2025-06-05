import { asr } from './ai/asr';
import { tts } from './ai/tts';
import { translation } from './ai/translation';
import { textGeneration } from './ai/text-generation';
import { imageGeneration } from './ai/browser/image-generation';
import { charToImage } from './browser/canvas/char-to-image';
import { imageTextToText } from './ai/image-text-to-text';
import { musicGeneration } from './ai/music-generation';
import { TaskType, TaskData, TaskResult, TaskProcessor } from './types';

export const taskProcessors: Record<TaskType, TaskProcessor> = {
  'automatic-speech-recognition': asr,
  'text-to-speech': tts,
  'translation': translation,
  'text-generation': textGeneration,
  'image-generation': imageGeneration,
  'char-to-image': charToImage,
  'image-text-to-text': imageTextToText,
  'music-generation': musicGeneration
};

export type { TaskType, TaskData, TaskResult, TaskProcessor };

export { asr, tts, translation, textGeneration, imageGeneration, charToImage, imageTextToText, musicGeneration };