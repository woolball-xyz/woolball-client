---
description: "Security guidelines — always loaded. XSS prevention, sanitization, and secure defaults."
alwaysApply: true
---

# Security Guidelines

## Never Use innerHTML with Untrusted Data

Any data that originates outside the application — WebSocket messages, API responses, URL parameters, user input — must never be assigned directly to `innerHTML` or `outerHTML`. Use `textContent` for plain text output. If you genuinely need to render HTML, sanitize it with DOMPurify first.

```ts
// Displaying a label from a WebSocket message:
element.textContent = message.type;

// Rendering HTML from a trusted source:
element.innerHTML = DOMPurify.sanitize(htmlContent);
```

## Validate Incoming WebSocket Messages

Before processing any message received over a WebSocket, check that it has the expected structure using a type guard. Never assume a message conforms to the expected shape.

```ts
function isWorkerEvent(msg: unknown): msg is WorkerEvent {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    typeof (msg as WorkerEvent).Id === 'string' &&
    typeof (msg as WorkerEvent).Key === 'string' &&
    typeof (msg as WorkerEvent).Value === 'string'
  );
}

socket.onmessage = (event) => {
  try {
    const msg = JSON.parse(event.data);
    if (!isWorkerEvent(msg)) return;
    handleWorkerEvent(msg);
  } catch {
    // malformed JSON — discard
  }
};
```

## WebSocket Protocol

WebSocket connections carry AI task payloads including audio and text. Always use `wss://` for connections in production. Derive the protocol from the page context instead of hardcoding.

```ts
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${wsProtocol}//${host}/ws`;
```

## Use crypto.randomUUID() for Identifiers

Use the Web Crypto API for any identifier used in connection or session tracking. `Math.random()` is not cryptographically secure.

```ts
const clientId = crypto.randomUUID();
```

## Subresource Integrity for External Scripts

Any `<script>` or `<link>` loaded from an external CDN must include `integrity` and `crossorigin` attributes. Without SRI, a compromised CDN is a full code execution vector.

```html
<script
  src="https://cdn.example.com/lib.js"
  integrity="sha384-<hash>"
  crossorigin="anonymous"
></script>
```

## Create DOM Elements Programmatically

When building UI programmatically (e.g. outside of React JSX), create elements with `document.createElement` and attach listeners with `addEventListener`. Never insert event handler strings via `innerHTML`.

```ts
const btn = document.createElement('button');
btn.textContent = 'Open details';
btn.addEventListener('click', () => modal.showModal());
container.appendChild(btn);
```

## Guard Verbose Logging

Do not log task content, user-supplied data, or AI model outputs in production. Wrap detailed logs with an environment check.

```ts
if (import.meta.env.DEV) {
  console.log('[Worker] Result:', result);
}
```
