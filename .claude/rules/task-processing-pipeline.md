---
description: "How Woolball receives tasks via WebSocket and dispatches them to the correct execution path. Always loaded."
alwaysApply: true
---

# Task Processing Pipeline

## Overview

The `Woolball` class (`src/providers/Woolball.ts`) is the core: it opens a WebSocket to the server, receives task messages, routes them to the correct handler, and sends results back.

```
WebSocket message → handleWebSocketMessage → processEvent → [worker|browser|node_worker] → sendWebSocketMessage(PROCESS_RESULT)
```

## WebSocket Message Handling

`Woolball.connectWebSocket` opens `ws://{url}/{clientId}` and handles three message types:

| Message | Action |
|---|---|
| `"ping"` | Ignored (keepalive from server) |
| `"node_count:N"` | Emits `node_count` event with parsed count |
| JSON `{Id, Key, Value}` | Parsed and dispatched via `handleWebSocketMessage` |

## processEvent — The Dispatch Router

`processEvent(type, value)` is the central dispatch point:

1. Coerces string booleans (`"true"`/`"false"`) to actual booleans
2. Looks up execution type via `getTaskExecutionType(type, environment)`
3. Dispatches based on execution type:

| ExecutionType | How it runs | Used when |
|---|---|---|
| `'worker'` | Creates Blob URL Web Worker from `worker-string.ts` | Browser, AI tasks |
| `'browser'` | Calls handler function directly on main thread | Extension AI tasks, browser canvas tasks |
| `'node_worker'` | Imports `node-worker.ts`, runs via `processWithoutNodeWorker` | Node.js environment |

## Worker Execution (browser AI tasks)

For `executionType === 'worker'`:
1. `createWorker(type)` → gets `workerSource` from `workerTypes` Map → creates `Blob` → `URL.createObjectURL` → `new Worker(url)`
2. Posts the `value` object to the worker via `worker.postMessage(value)`
3. Worker's `self.onmessage` calls `process(event)` → looks up `taskProcessors[task]` → runs it → `self.postMessage(result)`
4. On success: resolves with `e.data`; on error: resolves with `{ error }`
5. Worker is terminated after single use (one task per worker)

## Browser Execution (extension/canvas tasks)

For `executionType === 'browser'`:
1. Gets handler function from `getTaskHandler(type, environment)`
2. Calls `handler(value)` directly
3. Returns result or `{ error }` on catch

## Node Worker Execution

For `executionType === 'node_worker'`:
1. Dynamically imports `./node-worker.js`
2. Calls `processWithoutNodeWorker(type, value)` — runs the task processor directly (despite the name, it doesn't use worker_threads)
3. Only `'transformers'` provider is supported in Node.js

## Result Dispatch

After `processEvent` returns:
- If `response.error` exists → sends `{ type: "ERROR", data: { requestId: Id, error } }`
- Otherwise → sends `{ type: "PROCESS_RESULT", data: { requestId: Id, response } }`

Both are sent via `sendWebSocketMessage` which serializes to JSON and sends over the WebSocket.

## Event System

`Woolball` emits lifecycle events via `on(status, listener)`:
- `'started'` — when a task message is received
- `'success'` — when processing completes without error
- `'error'` — when processing fails
- `'node_count'` — when server broadcasts node count update

## Key Invariant

**processEvent resolves with `{ error }` — it does NOT reject.** Error cases are communicated through the resolved value, not Promise rejection. Tests must assert against the resolved value, not use `expect().rejects`.
