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

## Browser API Tasks

| API | Task | Description | Status |
|-----|------|-------------|--------|
| **Canvas API** | Character-to-Image | Converts a character to an image | ✅ Implemented |
| **Canvas API** | HTML-to-Image | Converts HTML content to an image | ✅ Implemented |

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
```

## Usage Options

### Web Application

See the `usage` directory for a complete React-based web application example that demonstrates how to integrate the Woolball client into a web application.

### Chrome Extension

A Chrome extension is available in the `chrome-extension` directory, allowing users to contribute their browser's computing resources to a Woolball server while browsing.

To build and use the Chrome extension:

```bash
# Build the Woolball client library
npm run build:all

# Install extension dependencies
cd chrome-extension
npm install

# Build the extension
npm run build
```

Then load the extension in Chrome from the `chrome-extension/dist` directory.

### Demo Pages

Simple demo pages are available in the `demo` directory:

```bash
# Serve the demo pages
npm run serve:demo
```

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build:all

# Run tests
npm test

# Run end-to-end tests
npm run test:e2e
```

## License

This project is licensed under the MPL-2.0 License - see the LICENSE file for details.



