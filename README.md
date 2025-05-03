# woolball-client 🧶  
[![npm](https://img.shields.io/npm/v/woolball-client?color=crimson&logo=npm)](https://www.npmjs.com/package/woolball-client)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=woolball-xyz_browser-node&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=woolball-xyz_browser-node)

*Turn any open tab into an AI compute node*

`woolball-client` establishes a connection between a user's browser and a running woolball-server instance. It utilizes WebSocket to receive job requests, executes the specified model locally using WebGPU or WASM, and transmits the outcome back to the server in real-time.


> ⚠️ **Important**: Before using this library, make sure you have the [woolball-server](https://github.com/woolball-xyz/woolball-server) running


## Supported Tasks

| Provider | Task | Models | Status |
|----------|------|--------|--------|
| **[Transformers.js](https://github.com/huggingface/transformers.js)** | Speech-to-Text | [ONNX Models](https://huggingface.co/models?pipeline_tag=automatic-speech-recognition&library=transformers.js&sort=trending) | ✅ Implemented |
| **[Transformers.js](https://github.com/huggingface/transformers.js)** | Text-to-Speech | [ONNX Models](https://huggingface.co/models?pipeline_tag=text-to-speech&library=transformers.js&sort=trending) | 🚧 Pending |
| **[Transformers.js](https://github.com/huggingface/transformers.js)** | Translation | [ONNX Models](https://huggingface.co/models?pipeline_tag=translation&library=transformers.js&sort=trending) | 🚧 Pending |
| **[Transformers.js](https://github.com/huggingface/transformers.js)** | Image-Text-to-Text | [ONNX Models](https://huggingface.co/models?pipeline_tag=image-text-to-text&library=transformers.js&sort=trending) | 🚧 Pending |
| **[Transformers.js](https://github.com/huggingface/transformers.js)** | Text-Generation | [ONNX Models](https://huggingface.co/models?pipeline_tag=text-generation&library=transformers.js&sort=trending) | 🚧 Pending |
| **[WebLLM](https://github.com/mlc-ai/web-llm)** | Text Generation | [MLC Models](https://mlc.ai/models) | 🚧 Pending |
| **[MediaPipe](https://ai.google.dev/edge/mediapipe/solutions/guide)** | Text Generation | [LiteRT Models](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference#models) | 🚧 Pending |


## Quick Start

1. Install the package:
```bash
npm install woolball-client
```

2. Import and use in your code:
```typescript
import Woolball from 'woolball-client';

// Initialize with a client ID
const woolball = new Woolball('your-client-id', 'ws.server.com'); // ws://localhost:9003 by default

// Listen for task events
woolball.on('started', (event) => {
  console.log('Task started:', event.id);
});

woolball.on('success', (event) => {
  console.log('Task completed:', event.id);
});

woolball.on('error', (event) => {
  console.log('Task failed:', event.id);
});
```

## Local Development

1. Build the project:
```bash
npm run build:all
```

2. Start the demo server:
```bash
npm run serve:demo
```

This will start an HTTP server on port 3000. Access the demo applications in your browser:

- WebSocket Demo: http://localhost:3000/demo/websocket.html
- HTTP Demo: http://localhost:3000/demo/http.html



