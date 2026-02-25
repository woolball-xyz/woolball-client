---
description: "Three execution environments (browser/extension/node) and how TASK_CONFIGS maps task types to handlers."
globs: "src/providers/TaskAvailability.ts,src/providers/Woolball.ts,src/providers/node-worker.ts"
---

# Execution Environments

## Environment Detection

`Woolball` accepts an `environment` option (`'browser' | 'extension' | 'node'`), defaulting to `'browser'`. The environment determines which execution path each task type uses.

## TASK_CONFIGS — The Routing Table

`src/providers/TaskAvailability.ts` defines `TASK_CONFIGS: Record<TaskType, TaskConfig>`:

```
                         browser          extension        node
ASR                      worker           browser          node_worker
TTS                      worker           browser          node_worker
Translation              worker           browser          node_worker
TextGeneration           worker           browser          node_worker
ImageTextToText          worker           browser          node_worker
CharToImage              browser          —                —
HtmlToImage              browser          —                —
```

- **worker** = Blob URL Web Worker (isolated thread, WebGPU/WASM)
- **browser** = Direct function call on main thread
- **node_worker** = Node.js `processWithoutNodeWorker` (direct call despite the name)

## Why AI Tasks Use Workers in Browser

AI inference (Transformers.js, WebLLM, MediaPipe) is CPU/GPU-intensive. Running it on the main thread would freeze the UI. The Web Worker runs in an isolated thread with its own copy of the bundled code (`worker-string.ts`).

## Why Extensions Run Directly

Chrome extension service workers cannot create Web Workers from Blob URLs (CSP restriction). So extension tasks call the handler function directly. This means AI inference runs on the service worker thread.

## Why Canvas Tasks Are Browser-Only

`char-to-image` and `html-to-image` require DOM access (`document.createElement('canvas')`, `document.createElement('iframe')`). Neither extensions nor Node.js have DOM, so these tasks are only available in browser.

## Handler Resolution

At construction time, `Woolball` iterates `TASK_CONFIGS` and populates `workerTypes` Map:
```typescript
Object.keys(TASK_CONFIGS).forEach((taskType) => {
    const handler = getTaskHandler(taskType, environment);
    if (handler) this.workerTypes.set(taskType, handler);
});
```

For `'worker'` execution: handler is the `workerCode` string (11MB bundle)
For `'browser'` execution: handler is the actual function reference from `taskProcessors`
For `'node_worker'` execution: handler is the function reference (used via dynamic import at dispatch time)

## Adding a New Environment

If you need a new environment (e.g., `'deno'`, `'react-native'`):
1. Add it to the `Environment` type in `TaskAvailability.ts`
2. Add the environment column to each task in `TASK_CONFIGS`
3. Handle the execution type in `Woolball.processEvent`
4. Update `getCurrentEnvironment()` detection logic
