---
description: "AI provider system: transformers, webllm, mediapipe, kokoro, prompt-api — how each processes tasks."
globs: "src/utils/tasks/ai/**"
---

# AI Providers

## Provider Selection

Each task receives a `provider` field in its `TaskData`. The task processor uses it to select the AI backend:

| Provider | Library | Tasks supported | Device |
|---|---|---|---|
| `transformers` (default) | `@huggingface/transformers` | All AI tasks | WebGPU or WASM (browser), CPU (node) |
| `webllm` | `@mlc-ai/web-llm` | text-generation | WebGPU |
| `mediapipe` | `@mediapipe/tasks-genai` | text-generation | WebGPU |
| `kokoro` | `kokoro-js` | text-to-speech | WASM |
| `prompt-api` | Chrome built-in AI | translation, text-generation, image-text-to-text | Browser API |

## Transformers.js (Default Provider)

Used by all task processors as the default. Key patterns:

```typescript
const { pipeline, env } = await import('@huggingface/transformers');
env.allowLocalModels = false;  // always download from HuggingFace Hub
const { getTransformersDevice } = await import('../../../utils/environment.js');
const pipe = await pipeline(taskType, model, {
    dtype: dtype,
    device: getTransformersDevice('webgpu'),  // 'cpu' in Node.js
});
const result = await pipe(input, options);
await pipe.dispose();  // ALWAYS dispose to free memory
```

`getTransformersDevice` returns `'cpu'` in Node.js, otherwise the requested device (`'webgpu'` or `'wasm'`).

### Per-Task Device Defaults

| Task | Default device |
|---|---|
| ASR | `webgpu` |
| TTS (transformers) | `wasm` |
| Translation | `wasm` |
| Text Generation | `wasm` |

## WebLLM Provider

For text-generation only. Uses MLC's WebLLM with a persistent engine:

```typescript
const webllm = await import('@mlc-ai/web-llm');
if (!webLLMEngine) {
    webLLMEngine = await webllm.CreateMLCEngine(model, {});
}
const response = await webLLMEngine.chat.completions.create({ messages, ... });
```

Key difference: the engine is **cached globally** (`webLLMEngine` module-level variable). It persists across tasks to avoid re-loading the model.

## MediaPipe Provider

For text-generation only. Uses MediaPipe GenAI with WASM from CDN:

```typescript
const { FilesetResolver, LlmInference } = await import('@mediapipe/tasks-genai');
const genaiFileset = await FilesetResolver.forGenAiTasks(wasmPath);
mediaPipeLLM = await LlmInference.createFromOptions(genaiFileset, options);
```

Also cached globally (`mediaPipeLLM`). The `model` parameter is a direct URL to the model asset.

## Kokoro Provider

For TTS only. Uses kokoro-js:

```typescript
const { KokoroTTS } = await import('kokoro-js');
const tts = await KokoroTTS.from_pretrained(model, { dtype: dtype || 'q8' });
const audio = await tts.generate(text, { voice: options.voice });
```

Returns audio as base64 via `bufferToBase64(blobToArrayBuffer(audio.toBlob()))`.

## Prompt API Provider

Chrome's built-in AI (experimental). Available only in Chrome Canary with flags enabled.

- **Translation**: Uses `self.Translator.create({ sourceLanguage, targetLanguage })` → `translator.translate(input)`
- **Text Generation**: Uses `window.LanguageModel.create({ initialPrompts })` → `session.prompt(text)`
- **Image-Text-to-Text**: Uses `window.LanguageModel.create({ expectedInputs: [{ type: "image" }] })`

Falls back to other providers if the Prompt API is not available.

## Adding a New Provider

1. Add the provider name to the `TaskData.provider` union type in `src/utils/tasks/types.ts`
2. Add a handler function in the relevant task processor (e.g., `handleNewProvider` in `text-generation.ts`)
3. Add the case to the provider switch in the task's entry function
4. If the provider needs caching, use a module-level variable (like `webLLMEngine`)
5. Run `npm run build:worker` to regenerate the worker bundle
