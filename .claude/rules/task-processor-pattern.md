---
description: "How to write a task processor: TaskData→TaskResult contract, provider switching, registration."
globs: "src/utils/tasks/**"
---

# Task Processor Pattern

## The Contract

Every task processor is a function with this signature:

```typescript
export async function myTask(data: TaskData): Promise<TaskResult>
```

Where:
```typescript
interface TaskData {
  input: string;          // the main input (text, base64 audio, JSON, etc.)
  model: string;          // HuggingFace model ID or provider-specific model
  dtype?: string;         // quantization type (e.g., 'q8', 'fp16', 'q4f16')
  provider?: 'transformers' | 'webllm' | 'mediapipe' | 'kokoro' | 'prompt-api';
  [key: string]: any;     // task-specific options
}
```

`TaskResult` is `any` — the shape depends on the task type.

## Registration

Every task processor must be registered in `src/utils/tasks/index.ts`:

```typescript
export const taskProcessors: Record<TaskType, TaskProcessor> = {
  'automatic-speech-recognition': asr,
  'text-to-speech': tts,
  // ... add new task here
};
```

And the task type string must be added to the `TaskType` union in `src/utils/tasks/types.ts`.

## Provider Switching Pattern

Task processors that support multiple providers use a switch:

```typescript
export async function myTask(data: TaskData): Promise<TaskResult> {
  const { input, model, dtype, provider = 'transformers', ...options } = data;

  switch (provider) {
    case 'webllm':
      return await handleWebLLM(input, model, options);
    case 'prompt-api':
      return await handlePromptAPI(input, options);
    default:
      return await handleTransformers(input, model, dtype, options);
  }
}
```

## Input Formats per Task Type

| Task type | `input` contains | Additional required fields |
|---|---|---|
| ASR | base64-encoded audio (WAV) | — |
| TTS | plain text | `voice` (optional) |
| Translation | plain text | `srcLang`, `tgtLang` |
| Text Generation | JSON string of `[{role, content}]` messages | `max_new_tokens`, `temperature` (optional) |
| Image-Text-to-Text | JSON string of `{image: base64, text: string}` | — |
| Char-to-Image | single character string | — |
| HTML-to-Image | HTML string | `width`, `height` (optional) |

## Result Formats per Task Type

| Task type | Result shape |
|---|---|
| ASR | `{ text: string, chunks?: [...] }` |
| TTS | `{ audio: string }` (base64 WAV) |
| Translation | `{ translatedText: string }` |
| Text Generation | `{ generatedText: string }` |
| Image-Text-to-Text | `{ generatedText: string }` |
| Char-to-Image | `{ image: string }` (base64 PNG) |
| HTML-to-Image | `{ image: string }` (base64 PNG/JPEG) |

## DOM vs Non-DOM Tasks

AI tasks (ASR, TTS, Translation, TextGen, ImageTextToText) run without DOM access — they work in Web Workers.

Canvas tasks (CharToImage, HtmlToImage) require DOM. They are loaded lazily via `createDomTaskLoader`:
```typescript
const createDomTaskLoader = (taskPath: string) => {
  return async (data: TaskData): Promise<TaskResult> => {
    const module = await import(taskPath);
    const taskFunction = module.default || Object.values(module)[0];
    return taskFunction(data);
  };
};
```

## After Changing a Task Processor

**Always run `npm run build:worker`** to regenerate `src/providers/worker-string.ts`. This file bundles all task processors into the Web Worker. If you skip this step, browser workers will use the old code.
