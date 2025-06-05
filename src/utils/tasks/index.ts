import { asr } from './ai/asr';
import { tts } from './ai/tts';
import { translation } from './ai/translation';
import { textGeneration } from './ai/text-generation';
import { imageGeneration } from './ai/browser/image-generation';
import { charToImage } from './browser/canvas/char-to-image';
import { imageTextToText } from './ai/image-text-to-text';
import { musicGeneration } from './ai/music-generation';

import { TaskType, TaskData, TaskResult, TaskProcessor } from './types';
import { audioCompression } from './browser/webcodecs/audio-compression';
import { imageCompression } from './browser/webcodecs/image-compression';
import { videoCompression } from './browser/webcodecs/video-compression';
import { audioConversion } from './browser/webcodecs/audio-conversion';
import { imageConversion } from './browser/webcodecs/image-conversion';
import { videoConversion } from './browser/webcodecs/video-conversion';
import { mediaConversion } from './browser/webcodecs/media-conversion';
import { browserSpeechRecognition } from './browser/speech/browser-speech-recognition';
import { browserSpeechSynthesis } from './browser/speech/browser-speech-synthesis';

export const taskProcessors: Record<TaskType, TaskProcessor> = {
  'automatic-speech-recognition': asr,
  'text-to-speech': tts,
  'translation': translation,
  'text-generation': textGeneration,
  'image-generation': imageGeneration,
  'char-to-image': charToImage,
  'image-text-to-text': imageTextToText,
  'music-generation': musicGeneration,
  'video-compression': videoCompression,
  'audio-compression': audioCompression,
  'image-compression': imageCompression,
  'video-conversion': videoConversion,
  'audio-conversion': audioConversion,
  'image-conversion': imageConversion,
  'media-conversion': mediaConversion,
  'browser-speech-recognition': browserSpeechRecognition,
  'browser-speech-synthesis': browserSpeechSynthesis,
};

export type { TaskType, TaskData, TaskResult, TaskProcessor };

export { asr, tts, translation, textGeneration, imageGeneration, charToImage, imageTextToText, musicGeneration, videoCompression, audioCompression, imageCompression, videoConversion, audioConversion, imageConversion, mediaConversion, browserSpeechRecognition, browserSpeechSynthesis };