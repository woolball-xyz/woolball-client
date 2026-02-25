---
description: "Web Worker lifecycle: worker-string.ts bundle, Blob URL creation, single-use workers, message protocol."
globs: "src/providers/worker.ts,src/providers/worker-string.ts,src/providers/Woolball.ts,scripts/build-worker.js"
---

# Web Worker Lifecycle

## The Worker Bundle

`src/providers/worker-string.ts` is an **auto-generated 11MB file** that contains the entire worker JavaScript code as a string export. It is built by `scripts/build-worker.js` using esbuild.

The bundle includes:
- `src/providers/worker.ts` (entry point)
- All task processors from `src/utils/tasks/`
- All dependencies (`@huggingface/transformers`, `kokoro-js`, `wav-encoder`, `wavefile`, etc.)

## How Workers Are Created

`Woolball.createWorker(type)`:

```typescript
const workerSource = this.workerTypes.get(type);  // the worker-string code
const blob = new Blob([workerSource], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(blob);
const worker = new Worker(workerUrl);
URL.revokeObjectURL(workerUrl);  // URL revoked immediately, worker already loaded
```

Every task creates a **new Worker instance**. Workers are single-use — terminated after one task completes.

## Worker Message Protocol

### Incoming (main thread → worker)

The main thread sends the full `value` object (TaskData) via `worker.postMessage(value)`:
```json
{
  "task": "automatic-speech-recognition",
  "input": "base64AudioData...",
  "model": "openai/whisper-tiny",
  "dtype": "q8"
}
```

Note: `task` field is included in `value` by the server when it sends the WebSocket message.

### Worker Processing

`worker.ts` handles the message:
```typescript
self.onmessage = (event: MessageEvent) => {
    process(event);
};

const process = async ({ data }: MessageEvent) => {
    const { task, ...taskData } = data;
    const processor = taskProcessors[task as TaskType];
    const result = await processor(taskData);
    self.postMessage(result);  // success
    // OR on error:
    self.postMessage({ error: errorMessage });
};
```

### Outgoing (worker → main thread)

- **Success**: `self.postMessage(result)` — the task-specific result object
- **Error**: `self.postMessage({ error: "message" })` — always includes `error` key

### Main Thread Reception

`Woolball.processEvent` registers one-shot listeners:
```typescript
worker.addEventListener('message', messageHandler);  // success or {error}
worker.addEventListener('error', errorHandler);       // worker crash
```

Both handlers terminate the worker and resolve the Promise.

## Rebuilding the Worker

**Trigger**: Any change to files in `src/providers/worker.ts` or `src/utils/tasks/**`

**Command**: `npm run build:worker`

**What happens**:
1. `scripts/build-worker.js` runs esbuild with the worker entry point
2. Output is wrapped as a TypeScript string export
3. Written to `src/providers/worker-string.ts`

**If you forget to rebuild**: Browser workers will use the old bundled code. Changes to task processors will appear to have no effect in the browser (but will work in extension and Node.js, which import directly).

## Never Edit worker-string.ts

This file is 11MB of auto-generated JavaScript. Do not:
- Edit it manually
- Include it in code review diffs
- Commit it without regenerating first
