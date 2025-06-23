import { asr } from './ai/asr';
import { tts } from './ai/tts';
import { translation } from './ai/translation';
import { textGeneration } from './ai/text-generation';
// import { imageGeneration } from './ai/browser/image-generation';

import { imageTextToText } from './ai/image-text-to-text';
import { charToImage } from './browser/canvas/char-to-image';
import { htmlToImage } from './browser/canvas/html-to-image';

import { TaskType, TaskData, TaskResult, TaskProcessor } from './types';

export const taskProcessors: Record<TaskType, TaskProcessor> = {
  'automatic-speech-recognition': asr,
  'text-to-speech': tts,
  'translation': translation,
  'text-generation': textGeneration,
  'image-text-to-text': imageTextToText,
  'char-to-image': charToImage,
  'html-to-image': htmlToImage,
};

export type { TaskType, TaskData, TaskResult, TaskProcessor };

export { asr, tts, translation, textGeneration, imageTextToText, charToImage, htmlToImage };