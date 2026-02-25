# CLAUDE.md

woolball-client is a TypeScript/JavaScript library that enables browsers to act as distributed AI inference nodes. It connects to a woolball-server via WebSocket, receives AI tasks, processes them using HuggingFace Transformers.js (WebGPU/WASM), and returns results. The repo contains three sub-projects: the core npm library (`src/`), a React demo UI (`browser-ui/`), and a Chrome extension (`chrome-extension/`).

## Commands

### Core Library (root)
- Build TypeScript: `npm run build`
- Build browser bundle: `npm run build:browser`
- Build Web Worker bundle: `npm run build:worker` (regenerates src/providers/worker-string.ts)
- Build everything: `npm run build:all`
- Run unit tests: `npm test`
- Run E2E tests: `npm run test:e2e` (Playwright, requires built app)

### browser-ui (React demo)
- Dev server: `cd browser-ui && npm run dev`
- Build: `cd browser-ui && npm run build`
- Lint: `cd browser-ui && npm run lint`

### chrome-extension
- Dev (watch): `npm run dev:extension`
- Build: `npm run build:extension`

## Before Every Change

- Run `npm run build` before committing to catch TypeScript errors
- If you change anything in `src/providers/worker.ts` or any file in `src/utils/tasks/`, you MUST run `npm run build:worker` to regenerate `src/providers/worker-string.ts`
- Run `npm test` to check for regressions
- For browser-ui changes: `cd browser-ui && npm run lint`
- Do NOT commit `src/providers/worker-string.ts` as a code review diff — it is an 11MB auto-generated file
- Do NOT edit `src/providers/worker-string.ts` — always regenerate via `npm run build:worker`

## Decision Tree: Where to Look

| Working on... | Read first |
|---|---|
| Core library entry point | `src/index.ts` |
| WebSocket connection + task dispatch | `src/providers/Woolball.ts` |
| Task routing per environment | `src/providers/TaskAvailability.ts` (TASK_CONFIGS) |
| Adding a new task type | `src/utils/tasks/types.ts` → `src/utils/tasks/index.ts` → `src/providers/TaskAvailability.ts` |
| ASR (speech-to-text) | `src/utils/tasks/ai/asr.ts` |
| TTS | `src/utils/tasks/ai/tts.ts` |
| Translation | `src/utils/tasks/ai/translation.ts` |
| Text generation (LLM) | `src/utils/tasks/ai/text-generation.ts` |
| Image+text (multimodal) | `src/utils/tasks/ai/image-text-to-text.ts` |
| Canvas tasks | `src/utils/tasks/browser/canvas/` |
| Web Worker entry point | `src/providers/worker.ts` |
| Node.js worker | `src/providers/node-worker.ts` |
| Browser compatibility | `src/utils/browser/compatibility.ts` |
| Demo UI (React) | `browser-ui/src/App.tsx` |
| Demo UI WebSocket orchestration | `browser-ui/src/WebSocketManager.ts` |
| Demo UI env vars | `browser-ui/src/utils/env.ts` |
| Chrome extension | `chrome-extension/background.js`, `chrome-extension/popup.js` |
| Build scripts | `scripts/build-lib.js`, `scripts/build-worker.js` |
| CI/CD | `.github/workflows/CI-CD.yml` |

## Architecture

woolball-client is a client-side AI inference library with three execution environments: `browser` (Web Worker + WebGPU/WASM), `extension` (Chrome service worker), and `node` (worker_threads). The main class `Woolball` opens a WebSocket to the server, receives task messages, and routes them via `TaskAvailability.TASK_CONFIGS` to the correct execution path. In browser, AI tasks run in a Blob-URL Web Worker built from the bundled `worker-string.ts`; canvas tasks run on the main thread. The `browser-ui` is a standalone React app that instantiates multiple `Woolball` instances to simulate distributed nodes. The Chrome extension runs `Woolball` in a service worker background script.

## Key Directories

| Path | Purpose |
|---|---|
| `src/` | Core library — published to npm |
| `src/providers/Woolball.ts` | Main class: WS lifecycle, task dispatch |
| `src/providers/TaskAvailability.ts` | TASK_CONFIGS: maps TaskType x Environment to handler |
| `src/providers/worker.ts` | Web Worker entry point |
| `src/providers/worker-string.ts` | AUTO-GENERATED (11MB) — do not edit |
| `src/utils/tasks/` | Task processor implementations |
| `src/__tests__/` | Jest unit tests |
| `browser-ui/` | React demo app (separate npm project) |
| `browser-ui/src/App.tsx` | Main React component |
| `browser-ui/src/WebSocketManager.ts` | Manages Woolball instances |
| `chrome-extension/` | Chrome MV3 extension |
| `scripts/` | Build scripts (esbuild) |
| `e2e-tests/` | Playwright E2E tests |

## Rules Index (.claude/rules/)

| File | Loads when | Topic |
|---|---|---|
| `task-processing-pipeline.md` | Always | How Woolball dispatches tasks to workers/browser/node |
| `execution-environments.md` | Editing TaskAvailability or Woolball | Browser/extension/node dispatch rules, TASK_CONFIGS |
| `ai-providers.md` | Editing task processors | Provider system: transformers, webllm, mediapipe, kokoro, prompt-api |
| `task-processor-pattern.md` | Editing src/utils/tasks/ | How to write a TaskProcessor, input/output formats |
| `worker-lifecycle.md` | Editing worker or build scripts | Worker bundle, Blob URL, message protocol, rebuild rules |
| `websocket-protocol.md` | Editing Woolball or WebSocket code | WS message format, task/result/error protocol |
| `security.md` | Always | XSS prevention, innerHTML rules, wss:// defaults |
| `build-config.md` | Editing configs | Worker build, production mode |
| `testing.md` | Editing tests | Correct API facts, mock patterns |
| `chrome-extension.md` | Editing extension | MV3 constraints, permissions |

## Agents (.claude/agents/)

| Agent | Purpose |
|---|---|
| `task-processor-developer` | Develops new task processors with provider integration |
| `pipeline-debugger` | Debugs client-side task processing issues |

## Skills (.claude/skills/)

| Skill | Purpose |
|---|---|
| `/add-task-type` | Scaffold a new task type: processor, registration, TASK_CONFIGS |
| `/add-provider` | Add a new AI provider to an existing task type |
| `/run-tests` | Build, test, and lint |

## Critical Conventions

### Task types (exact strings — must match server)
- `'automatic-speech-recognition'` (NOT `'speech-recognition'`)
- `'text-to-speech'`
- `'translation'`
- `'text-generation'`
- `'image-text-to-text'`
- `'char-to-image'`
- `'html-to-image'`

### Execution environments
- `browser`: AI tasks via Web Worker, canvas tasks directly
- `extension`: All tasks directly in service worker
- `node`: AI tasks via worker_threads

### Providers
- `transformers` — HuggingFace Transformers.js (default)
- `webllm` — MLC WebLLM
- `mediapipe` — MediaPipe GenAI
- `kokoro` — Kokoro-js (TTS)
- `prompt-api` — Chrome built-in AI

### Anti-patterns to avoid
- Do NOT inject WebSocket message fields directly into `innerHTML`
- Do NOT use `Math.random()` for client IDs — use `crypto.randomUUID()`
- Do NOT hardcode `ws://` — use env vars
- Do NOT add code to `WebSocketConnection` class in `src/utils/websocket/index.ts` — it is dead code
- Do NOT add state or logic to `App.tsx` — extract to separate components
- Do NOT use `setInterval` for UI timer updates — use `requestAnimationFrame` + `useRef`
