# Demo Application for WoolBall browser-node

This application serves as a test client to validate the functionalities of the `browser-node` package, specifically the speech-to-text conversion feature using the implemented worker.

## How to use

### Prerequisites

Before running the demo application, you need to build the `browser-node` package and the speech-to-text worker:

```bash
npm run build:all
```

This command will:
1. Compile the TypeScript code
2. Create the browser-node bundle
3. Create the speech-to-text worker bundle

### Running the application

To start the demo server:

```bash
npm run serve:demo
```

This will start an HTTP server on port 3000. Access the application in your browser:

```
http://localhost:3000/demo/websocket.html

http://localhost:3000/demo/http.html
```
For both to work, the server must be running:

https://github.com/woolball-xyz/browser-network-server