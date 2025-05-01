# woolball-client

A client-side library for the Woolball platform that enables secure browser resource sharing for distributed AI task processing.

⚠️ **Important**: Before using this library, make sure you have the Woolball server running:

Follow the server setup instructions at [browser-network-server](https://github.com/woolball-xyz/browser-network-server)

## Quick Start

1. Install the package:
```bash
npm install woolball-client
```

2. Import and use in your code:
```typescript
import Woolball from 'woolball-client';

// Initialize with your client ID
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



