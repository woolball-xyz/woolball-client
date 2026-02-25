---
name: pipeline-debugger
description: "Debugs client-side task processing: WebSocket messages, worker dispatch, provider errors, result format issues."
---

# Client Pipeline Debugger Agent

You debug issues with task processing in woolball-client.

## Diagnostic Flow

### 1. Is the WebSocket connected?
- Check if `Woolball.wsConnection` is open
- Check browser console for "WebSocket connection established" or error messages
- Verify the server URL format: `ws://{host}:{port}/ws/{clientId}`

### 2. Is the task message arriving?
- Check if `handleWebSocketMessage` is called (look for 'started' event emission)
- Verify message has `Id`, `Key`, `Value` — all three are required and non-falsy
- Check if `Key` matches a valid `TaskType` string exactly

### 3. Is the execution type resolved?
- `getTaskExecutionType(type, environment)` returns `null` if the task isn't available in the current environment
- Canvas tasks (`char-to-image`, `html-to-image`) are only available in `browser`
- Check if the environment was set correctly in `Woolball` constructor options

### 4. Worker-specific issues
- **Worker creation fails**: Usually Blob URL or CSP issue. Check browser console for security errors
- **Worker hangs**: The AI model download might be slow or failing. Transformers.js downloads from HuggingFace Hub on first use
- **Worker posts error**: Check if the task processor threw. Look for `[Worker] Error:` in console
- **Double postMessage**: `worker.ts` has a bug where both inner catch and outer catch may call `self.postMessage` — the inner catch posts error then re-throws, outer catch also posts

### 5. Provider-specific issues
- **transformers**: Check `getTransformersDevice()` — returns 'cpu' in Node, device name in browser. Wrong device causes silent failures
- **webllm**: Requires WebGPU. `CreateMLCEngine` fails without GPU. Engine is cached — if first init fails, module-level var stays null
- **mediapipe**: WASM loaded from CDN (`cdn.jsdelivr.net`). If CDN is blocked, fails. `importScripts` errors in workers
- **kokoro**: TTS-specific. Model uses `q8` dtype by default
- **prompt-api**: Only available in Chrome Canary with flags. Check `'Translator' in self` or `window.LanguageModel`

### 6. Result format issues
- Each task type has a specific result shape (see task-processor-pattern.md)
- If the server gets unexpected JSON, check what `self.postMessage(result)` is sending
- Common issue: provider returns different shape than expected (e.g., `generatedText` vs `generated_text`)

### 7. Node.js-specific issues
- Only `transformers` provider works in Node.js
- `processWithoutNodeWorker` calls the processor directly (no worker thread)
- Dynamic imports of `node:worker_threads`, `node:path`, `node:fs` use `new Function('return import(...)')` to avoid bundler resolution
