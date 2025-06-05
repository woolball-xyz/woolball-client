# woolball-client 🧶  
[![npm](https://img.shields.io/npm/v/woolball-client?color=crimson&logo=npm)](https://www.npmjs.com/package/woolball-client)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=woolball-xyz_browser-node&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=woolball-xyz_browser-node)

*Turn any open tab into an AI compute node*

`woolball-client` establishes a connection between a user's browser and a running woolball-server instance. It utilizes WebSocket to receive job requests, executes the specified model locally using WebGPU or WASM, and transmits the outcome back to the server in real-time.


> ⚠️ **Important**: Before using this library, make sure you have the [woolball-server](https://github.com/woolball-xyz/woolball-server) running


## AI Tasks

| Provider | Task | Models | Status |
|----------|------|--------|--------|
| **[Transformers.js](https://github.com/huggingface/transformers.js)** | Speech-to-Text | [ONNX Models](https://huggingface.co/models?pipeline_tag=automatic-speech-recognition&library=transformers.js&sort=trending) | ✅ Implemented |
| **[Transformers.js](https://github.com/huggingface/transformers.js)** | Text-to-Speech | [ONNX Models](https://huggingface.co/models?pipeline_tag=text-to-speech&library=transformers.js&sort=trending&search=mms) | ✅ Implemented |
| **[Kokoro.js](https://github.com/hexgrad/kokoro)** | Text-to-Speech | [ONNX Models](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) | ✅ Implemented |
| **[Transformers.js](https://github.com/huggingface/transformers.js)** | Translation | [ONNX Models](https://huggingface.co/models?pipeline_tag=translation&library=transformers.js&sort=trending) | ✅ Implemented |
| **Prompt API** | Translation | Gemini Nano | 🧪 Experimental |
| **[Transformers.js](https://github.com/huggingface/transformers.js)** | Text-Generation | [ONNX Models](https://huggingface.co/models?pipeline_tag=text-generation&library=transformers.js&sort=trending) | ✅ Implemented |
| **[WebLLM](https://github.com/mlc-ai/web-llm)** | Text Generation | [MLC Models](https://mlc.ai/models) | ✅ Implemented |
| **[MediaPipe](https://ai.google.dev/edge/mediapipe/solutions/guide)** | Text Generation | [LiteRT Models](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference#models) | ✅ Implemented |
| **Prompt API** | Text Generation | Gemini Nano | 🧪 Experimental |
| **[Transformers.js](https://github.com/huggingface/transformers.js)** | Image-Text-to-Text | [ONNX Models](https://huggingface.co/models?pipeline_tag=image-text-to-text&library=transformers.js&sort=trending) | ⚠️ Partial |
| **Prompt API** | Image-Text-to-Text | Gemini Nano | 🧪 Experimental |
| **[diffusers.js](https://github.com/dakenf/diffusers.js)** | Image-Generation | [ONNX Models](https://huggingface.co/models?pipeline_tag=image-generation&library=transformers.js&sort=trending) | 🧪 Experimental |
| **[Magenta.js](https://github.com/magenta/magenta-js/tree/master/music)** | Music-Generation | MusicRNN, MusicVAE | 🧪 Experimental |

### Browser API Tasks

| Provider | Task | Description | Status |
|----------|------|-------------|--------|
| **[Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API)** | Speech Recognition | Converts spoken audio to text using browser's speech recognition | 🧪 Experimental |
| **[Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API)** | Speech Synthesis | Converts text to spoken audio using browser's speech synthesis | 🧪 Experimental |
| **[Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)** | Character-to-Image | Renders text characters as images using browser Canvas | 🧪 Experimental |
| **[WebCodecs](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)** | Image Compression | Compresses images using browser WebCodecs | 🧪 Experimental |
| **[WebCodecs](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)** | Audio Compression | Compresses audio using browser WebCodecs | 🧪 Experimental |
| **[WebCodecs](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)** | Video Compression | Compresses video using browser WebCodecs | 🧪 Experimental |
| **[WebCodecs](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)** | Image Conversion | Converts images between formats (WebP, JPEG, PNG, AVIF) | 🧪 Experimental |
| **[WebCodecs](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)** | Audio Conversion | Converts audio between formats (Opus, AAC, MP3) | 🧪 Experimental |
| **[WebCodecs](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)** | Video Conversion | Converts video between formats (VP9, VP8, H.264, AV1) | 🧪 Experimental |
| **[WebCodecs](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)** | Media Conversion | Converts mixed media (audio+video) between formats | 🧪 Experimental |

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



