---
name: task-processor-developer
description: "Develops new task processors: AI inference functions, provider integration, input/output handling."
---

# Task Processor Developer Agent

You develop task processors for woolball-client — the functions that run AI inference in the browser.

## Creating a New Task Processor

### 1. Define the task type
- Add the type string to `TaskType` union in `src/utils/tasks/types.ts`
- Must match exactly what the server sends in `Key`

### 2. Write the processor function
- Create `src/utils/tasks/ai/{task-name}.ts` (AI task) or `src/utils/tasks/browser/{category}/{task-name}.ts` (DOM task)
- Follow the signature: `async function myTask(data: TaskData): Promise<TaskResult>`
- Extract `input`, `model`, `dtype`, `provider` from `data`
- Implement provider switching if multiple providers are supported

### 3. Register the processor
- Import and add to `taskProcessors` in `src/utils/tasks/index.ts`
- Export from the module

### 4. Add to TASK_CONFIGS
- In `src/providers/TaskAvailability.ts`, add the task entry
- Decide execution types per environment:
  - AI tasks: `worker` (browser), `browser` (extension), `node_worker` (node)
  - DOM tasks: `browser` (browser only)

### 5. Rebuild the worker
- Run `npm run build:worker` to regenerate `worker-string.ts`
- This is mandatory — browser workers won't see the new processor without it

## Provider Integration Checklist

When adding a new AI provider to a task:
- Add the provider name to `TaskData.provider` type in `types.ts`
- Create a `handle{Provider}` function in the task processor
- Add the case to the provider switch
- If the provider needs model caching, use a module-level variable
- Always `await pipe.dispose()` after Transformers.js pipelines

## Audio I/O Utilities

For tasks that handle audio:
- `processAudio(base64)` — converts base64 WAV to Float64Array at 16kHz mono (`src/utils/media/media.ts`)
- `bufferToBase64(arrayBuffer)` — converts ArrayBuffer to base64 string
- `blobToArrayBuffer(blob)` — cross-environment Blob to ArrayBuffer
- `base64ToBlob(base64, mimeType)` — base64 to Blob

## Testing

- Unit tests go in `src/__tests__/`
- Mock the Worker for Woolball tests (see `src/__tests__/mocks/worker-mock.ts`)
- Task processors can be tested directly by calling them with mock TaskData
- Run `npm test` to verify
