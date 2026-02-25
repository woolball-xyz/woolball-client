---
description: "WebSocket message format between woolball-server and client: task messages, results, errors."
globs: "src/providers/Woolball.ts,src/utils/websocket/**"
---

# WebSocket Protocol

## Connection

`Woolball` connects to `ws://{serverUrl}/{clientId}`. The `clientId` identifies this inference node to the server.

## Incoming Messages (Server → Client)

### Ping (keepalive)
```
ping
```
Plain text, not JSON. Ignored by the client. Sent every 30 seconds by the server.

### Node Count Broadcast
```
node_count:5
```
Plain text with colon separator. Parsed to emit `node_count` event. Broadcast by server whenever a node connects or disconnects.

### Task Assignment
```json
{
  "Id": "a1b2c3d4-...",
  "Key": "automatic-speech-recognition",
  "Value": {
    "task": "automatic-speech-recognition",
    "input": "base64EncodedAudio...",
    "model": "openai/whisper-tiny",
    "dtype": "q8"
  }
}
```

- `Id` — unique task ID (maps to server's `TaskRequest.Id`)
- `Key` — task type string (must match `TaskType` enum and `TASK_CONFIGS` keys)
- `Value` — task parameters dictionary (becomes `TaskData` for the processor)

## Outgoing Messages (Client → Server)

### Success Response
```json
{
  "type": "PROCESS_RESULT",
  "data": {
    "requestId": "a1b2c3d4-...",
    "response": {
      "text": "transcribed text here"
    }
  }
}
```

### Error Response
```json
{
  "type": "ERROR",
  "data": {
    "requestId": "a1b2c3d4-...",
    "error": "Error message string"
  }
}
```

## Message Validation

The incoming task message must have all three fields (`Id`, `Key`, `Value`) as non-falsy. If any is missing, the message is logged and discarded:

```typescript
const { Id, Key, Value } = message;
if (!Id || !Key || !Value) {
    console.error('Invalid message format:', message);
    return;
}
```

## Task Type String Matching

The `Key` field must exactly match one of the `TaskType` strings:
- `automatic-speech-recognition` (NOT `speech-recognition` or `speech-to-text`)
- `text-to-speech`
- `translation`
- `text-generation`
- `image-text-to-text`
- `char-to-image`
- `html-to-image`

A mismatch means the task type is not found in `TASK_CONFIGS` and `processEvent` returns `{ error: "Task type 'X' is not supported" }`.

## One Task at a Time

After sending a task to a node, the server removes that node from the available pool. The node only re-enters the pool when the server's `TaskSockets` receives the result and calls `AddWebsocketInQueueAsync`. This means each node processes exactly one task at a time.
