export type TaskType = 'automatic-speech-recognition' | 'text-to-speech' | 'translation' | 'text-generation' | 'image-generation' | 'char-to-image' | 'image-text-to-text' | 'music-generation' | 'video-compression' | 'audio-compression' | 'image-compression' | 'video-conversion' | 'audio-conversion' | 'image-conversion' | 'media-conversion' | 'browser-speech-recognition' | 'browser-speech-synthesis';

export interface TaskData {
  input: string;
  model: string;
  dtype?: string;
  provider?: 'transformers' | 'webllm' | 'mediapipe' | 'kokoro' | 'diffusers' | 'prompt-api' | 'magenta' | 'browser';
  [key: string]: any;
}

export type TaskResult = any;

export interface TaskProcessor {
  (data: TaskData): Promise<TaskResult>;
}