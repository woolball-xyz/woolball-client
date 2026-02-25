export interface SpeechRecognitionTask {
  isProcessing: boolean;
  status: string;
  elapsedTime: number;
  model: string;
  dtype: string;
  language: string;
  includeTimestamps: boolean;
  enableStreaming: boolean;
}

export interface TextToSpeechTask {
  isProcessing: boolean;
  status: string;
  elapsedTime: number;
  model: string;
  dtype: string;
  voice: string;
  enableStreaming: boolean;
  provider: string;
}

export interface TranslationTask {
  isProcessing: boolean;
  status: string;
  elapsedTime: number;
  model: string;
  dtype: string;
  srcLang: string;
  tgtLang: string;
}

export interface TextGenerationTask {
  isProcessing: boolean;
  status: string;
  elapsedTime: number;
  model: string;
  dtype: string;
  provider: string;
  maxTokens: number;
  doSample: boolean;
  enableStreaming: boolean;
}

export interface ImageTextToTextTask {
  isProcessing: boolean;
  status: string;
  elapsedTime: number;
  model: string;
  dtype: string;
  maxTokens: number;
  doSample: boolean;
}

export interface TaskStates {
  speechRecognition: SpeechRecognitionTask;
  textToSpeech: TextToSpeechTask;
  translation: TranslationTask;
  textGeneration: TextGenerationTask;
  imageTextToText: ImageTextToTextTask;
}
