import { TaskStates } from '../types/tasks';

export const modelOptions = {
  speechRecognition: [
    { value: 'onnx-community/whisper-small', label: 'Whisper Small' },
    { value: 'onnx-community/whisper-base', label: 'Whisper Base' },
    { value: 'onnx-community/whisper-large-v3-turbo_timestamped', label: 'Whisper Large V3 Turbo' }
  ],
  textToSpeech: [
    // MMS Models (Multilingual)
    { value: 'Xenova/mms-tts-eng', label: 'English (MMS)', provider: 'transformers' },
    { value: 'Xenova/mms-tts-spa', label: 'Spanish (MMS)', provider: 'transformers' },
    { value: 'Xenova/mms-tts-por', label: 'Portuguese (MMS)', provider: 'transformers' },
    { value: 'Xenova/mms-tts-fra', label: 'French (MMS)', provider: 'transformers' },
    { value: 'Xenova/mms-tts-deu', label: 'German (MMS)', provider: 'transformers' },
    { value: 'Xenova/mms-tts-rus', label: 'Russian (MMS)', provider: 'transformers' },
    { value: 'Xenova/mms-tts-ara', label: 'Arabic (MMS)', provider: 'transformers' },
    { value: 'Xenova/mms-tts-hin', label: 'Hindi (MMS)', provider: 'transformers' },
    { value: 'Xenova/mms-tts-kor', label: 'Korean (MMS)', provider: 'transformers' },
    { value: 'Xenova/mms-tts-vie', label: 'Vietnamese (MMS)', provider: 'transformers' },
    { value: 'Xenova/mms-tts-ron', label: 'Romanian (MMS)', provider: 'transformers' },
    { value: 'Xenova/mms-tts-yor', label: 'Yoruba (MMS)', provider: 'transformers' },
    // Kokoro Models (High Quality)
    { value: 'onnx-community/Kokoro-82M-ONNX', label: 'Kokoro TTS', provider: 'kokoro' },
    { value: 'onnx-community/Kokoro-82M-v1.0-ONNX', label: 'Kokoro TTS v1.0', provider: 'kokoro' }
  ],
  translation: [
    { value: 'Xenova/nllb-200-distilled-600M', label: 'NLLB-200 Distilled 600M' }
  ],
  imageTextToText: [
    { value: 'HuggingFaceTB/SmolVLM-256M-Instruct', label: 'SmolVLM 256M' },
  ],
  textGeneration: [
    // Transformers.js Models
    { value: 'HuggingFaceTB/SmolLM2-135M-Instruct', label: 'SmolLM2 135M (Transformers)', provider: 'transformers' },
    { value: 'HuggingFaceTB/SmolLM2-360M-Instruct', label: 'SmolLM2 360M (Transformers)', provider: 'transformers' },
    { value: 'Mozilla/Qwen2.5-0.5B-Instruct', label: 'Qwen2.5 0.5B (Transformers)', provider: 'transformers' },
    { value: 'onnx-community/Qwen2.5-Coder-0.5B-Instruct', label: 'Qwen2.5 Coder 0.5B (Transformers)', provider: 'transformers' },
    // WebLLM Models
    { value: 'DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC', label: 'DeepSeek R1 Qwen 7B (WebLLM)', provider: 'webllm' },
    { value: 'DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC', label: 'DeepSeek R1 Llama 8B (WebLLM)', provider: 'webllm' },
    { value: 'SmolLM2-1.7B-Instruct-q4f32_1-MLC', label: 'SmolLM2 1.7B (WebLLM)', provider: 'webllm' },
    { value: 'Llama-3.1-8B-Instruct-q4f32_1-MLC', label: 'Llama 3.1 8B (WebLLM)', provider: 'webllm' },
    { value: 'Qwen3-8B-q4f32_1-MLC', label: 'Qwen3 8B (WebLLM)', provider: 'webllm' },
    // MediaPipe Models
    { value: 'https://woolball.sfo3.cdn.digitaloceanspaces.com/gemma2-2b-it-cpu-int8.task', label: 'Gemma2 2B CPU (MediaPipe)', provider: 'mediapipe' },
    { value: 'https://woolball.sfo3.cdn.digitaloceanspaces.com/gemma2-2b-it-gpu-int8.bin', label: 'Gemma2 2B GPU (MediaPipe)', provider: 'mediapipe' },
    { value: 'https://woolball.sfo3.cdn.digitaloceanspaces.com/gemma3-1b-it-int4.task', label: 'Gemma3 1B (MediaPipe)', provider: 'mediapipe' },
    { value: 'https://woolball.sfo3.cdn.digitaloceanspaces.com/gemma3-4b-it-int4-web.task', label: 'Gemma3 4B Web (MediaPipe)', provider: 'mediapipe' }
  ]
};

export const fixedAudioUrl = "https://ia600107.us.archive.org/1/items/whizbangv3n30_2503_librivox/whizbangv3n30_00_fawcett.mp3";

export const DEFAULT_TASK_STATES: TaskStates = {
  speechRecognition: {
    isProcessing: false,
    status: '',
    elapsedTime: 0,
    model: 'onnx-community/whisper-small',
    dtype: 'q4',
    language: 'en',
    includeTimestamps: false,
    enableStreaming: true
  },
  textToSpeech: {
    isProcessing: false,
    status: '',
    elapsedTime: 0,
    model: 'Xenova/mms-tts-eng',
    dtype: 'q8',
    voice: 'af_heart',
    enableStreaming: false,
    provider: 'transformers'
  },
  translation: {
    isProcessing: false,
    status: '',
    elapsedTime: 0,
    model: 'Xenova/nllb-200-distilled-600M',
    dtype: 'q8',
    srcLang: 'eng_Latn',
    tgtLang: 'por_Latn'
  },
  textGeneration: {
    isProcessing: false,
    status: '',
    elapsedTime: 0,
    model: 'HuggingFaceTB/SmolLM2-135M-Instruct',
    dtype: 'fp16',
    provider: 'transformers',
    maxTokens: 250,
    doSample: false,
    enableStreaming: false
  },
  imageTextToText: {
    isProcessing: false,
    status: '',
    elapsedTime: 0,
    model: 'HuggingFaceTB/SmolVLM-256M-Instruct',
    dtype: 'q4',
    maxTokens: 64,
    doSample: false
  }
};
