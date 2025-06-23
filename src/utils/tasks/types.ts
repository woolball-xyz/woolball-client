export type TaskType = 'automatic-speech-recognition' | 'text-to-speech' | 'translation' | 'text-generation' | 'image-text-to-text' | 'char-to-image' | 'html-to-image';

export interface TaskData {
  input: string;
  model: string;
  dtype?: string;
  provider?: 'transformers' | 'webllm' | 'mediapipe' | 'kokoro' | 'prompt-api';
  [key: string]: any;
}

export type TaskResult = any;

export interface TaskProcessor {
  (data: TaskData): Promise<TaskResult>;
}