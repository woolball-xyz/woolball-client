import '@mcp-b/global';
import { taskProcessors } from '../utils/tasks/index.js';
import type { TaskData } from '../utils/tasks/types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTool = any;

function toMcpResult(result: Record<string, unknown>) {
  if (result.error) {
    return {
      content: [{ type: 'text' as const, text: String(result.error) }],
      isError: true,
    };
  }
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(result) }],
  };
}

function buildToolDefinitions(): AnyTool[] {
  return [
    {
      name: 'automatic-speech-recognition',
      description: 'Transcribe audio to text using Whisper models. Runs entirely in your browser via WebGPU/WASM.',
      inputSchema: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'Base64-encoded WAV audio' },
          model: { type: 'string', description: 'HuggingFace model ID' },
          dtype: { type: 'string', description: 'Quantization type' },
          return_timestamps: { type: 'string', description: 'Return word-level timestamps' },
        },
        required: ['input'],
      },
      annotations: { readOnlyHint: true },
      async execute(args: Record<string, unknown>) {
        const data = {
          input: args.input as string,
          model: (args.model as string) || 'onnx-community/whisper-large-v3-turbo_timestamped',
          dtype: (args.dtype as string) || 'q8',
          return_timestamps: args.return_timestamps === 'true' || args.return_timestamps === true,
        };
        const result = await taskProcessors['automatic-speech-recognition'](data);
        return toMcpResult(result);
      },
    },
    {
      name: 'text-to-speech',
      description: 'Convert text to speech audio. Supports Transformers.js (MMS) and Kokoro providers with multiple voices.',
      inputSchema: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'Text to synthesize' },
          model: { type: 'string', description: 'HuggingFace model ID' },
          dtype: { type: 'string', description: 'Quantization type' },
          provider: { type: 'string', description: 'TTS provider' },
          voice: { type: 'string', description: 'Voice name (Kokoro provider only)' },
        },
        required: ['input'],
      },
      annotations: { readOnlyHint: true },
      async execute(args: Record<string, unknown>) {
        const data: TaskData = {
          input: args.input as string,
          model: (args.model as string) || 'facebook/mms-tts-eng',
          dtype: (args.dtype as string) || 'q8',
          provider: (args.provider as TaskData['provider']) || 'transformers',
          voice: args.voice as string | undefined,
        };
        const result = await taskProcessors['text-to-speech'](data);
        if (result.audio) {
          return { content: [{ type: 'resource', data: result.audio, mimeType: 'audio/wav' }] };
        }
        return toMcpResult(result);
      },
    },
    {
      name: 'translation',
      description: 'Translate text between 200+ languages using NLLB. Runs entirely in your browser.',
      inputSchema: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'Text to translate' },
          model: { type: 'string', description: 'HuggingFace model ID' },
          srcLang: { type: 'string', description: 'Source language code (FLORES200 format, e.g. eng_Latn)' },
          tgtLang: { type: 'string', description: 'Target language code (FLORES200 format, e.g. por_Latn)' },
          dtype: { type: 'string', description: 'Quantization type' },
        },
        required: ['input', 'srcLang', 'tgtLang'],
      },
      annotations: { readOnlyHint: true },
      async execute(args: Record<string, unknown>) {
        const data = {
          input: args.input as string,
          model: (args.model as string) || 'Xenova/nllb-200-distilled-600M',
          srcLang: args.srcLang as string,
          tgtLang: args.tgtLang as string,
          dtype: (args.dtype as string) || 'q8',
        };
        const result = await taskProcessors['translation'](data);
        return toMcpResult(result);
      },
    },
    {
      name: 'text-generation',
      description: 'Generate text using LLMs (SmolLM2, Qwen2.5, DeepSeek R1, Llama). Supports Transformers.js, WebLLM, and MediaPipe.',
      inputSchema: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'JSON array of messages [{role, content}]' },
          model: { type: 'string', description: 'Model ID' },
          dtype: { type: 'string', description: 'Quantization type' },
          provider: { type: 'string', description: 'LLM provider' },
          max_new_tokens: { type: 'string', description: 'Maximum tokens to generate' },
          temperature: { type: 'string', description: 'Sampling temperature' },
          do_sample: { type: 'string', description: 'Enable sampling' },
        },
        required: ['input'],
      },
      annotations: { readOnlyHint: true },
      async execute(args: Record<string, unknown>) {
        const data: TaskData = {
          input: args.input as string,
          model: (args.model as string) || 'HuggingFaceTB/SmolLM2-135M-Instruct',
          dtype: (args.dtype as string) || 'q4f16',
          provider: (args.provider as TaskData['provider']) || 'transformers',
          max_new_tokens: Number(args.max_new_tokens) || 250,
          temperature: Number(args.temperature) || 1.0,
          do_sample: args.do_sample === 'true' || args.do_sample === true,
        };
        const result = await taskProcessors['text-generation'](data);
        return toMcpResult(result);
      },
    },
    {
      name: 'image-text-to-text',
      description: 'Describe or answer questions about images using multimodal vision models. Runs in your browser.',
      inputSchema: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'JSON string of {image: base64, text: question}' },
          model: { type: 'string', description: 'Model ID' },
          dtype: { type: 'string', description: 'Quantization type' },
          max_new_tokens: { type: 'string', description: 'Maximum tokens to generate' },
          do_sample: { type: 'string', description: 'Enable sampling' },
        },
        required: ['input'],
      },
      annotations: { readOnlyHint: true },
      async execute(args: Record<string, unknown>) {
        const data = {
          input: args.input as string,
          model: (args.model as string) || 'llava-hf/llava-onevision-qwen2-0.5b-ov-hf',
          dtype: (args.dtype as string) || 'q4f16',
          max_new_tokens: Number(args.max_new_tokens) || 64,
          do_sample: args.do_sample === 'true' || args.do_sample === true,
        };
        const result = await taskProcessors['image-text-to-text'](data);
        return toMcpResult(result);
      },
    },
  ];
}

let registered = false;

export function registerWebMcpTools(): boolean {
  if (registered) return true;
  if (!navigator.modelContext) return false;

  for (const tool of buildToolDefinitions()) {
    navigator.modelContext.registerTool(tool);
  }

  registered = true;
  return true;
}

export function unregisterWebMcpTools(): void {
  if (!registered || !navigator.modelContext) return;

  for (const tool of buildToolDefinitions()) {
    navigator.modelContext.unregisterTool(tool.name);
  }

  registered = false;
}

export function isWebMcpAvailable(): boolean {
  return !!navigator.modelContext;
}

export function isWebMcpRegistered(): boolean {
  return registered;
}
