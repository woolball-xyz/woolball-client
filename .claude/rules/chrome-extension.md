---
description: "Chrome extension development guidelines: MV3 patterns, permissions, URL handling, storage, build."
globs: "chrome-extension/**"
---

# Chrome Extension Guidelines

## Generate IDs with the Web Crypto API

Use `crypto.randomUUID()` for any identifier — client IDs, session tokens, nonces. The Web Crypto API is available in both service workers and popup pages.

```js
const clientId = crypto.randomUUID();
```

## Validate User-Supplied Server URLs

The popup lets users type a server URL. Validate the format before connecting. A validation helper keeps this logic in one place and makes the error message clear.

```js
function isValidServerUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'wss:' || parsed.protocol === 'ws:';
  } catch {
    return false;
  }
}

// In popup.js, before connecting:
if (!isValidServerUrl(inputUrl)) {
  showError('Enter a valid WebSocket URL (ws:// or wss://)');
  return;
}
```

## Default to wss://

Any placeholder or default server address in the UI should use `wss://`. Use `ws://` only for local development (e.g. `ws://localhost:9003/ws`).

## Access the Woolball Class Through Its Public API

The `Woolball` class is compiled TypeScript. Accessing properties marked `private` from plain JavaScript bypasses TypeScript's access control at runtime. When you need to update internal state from the extension, add a public method to the class.

```js
// Avoid:
woolballClient.wsUrl = newUrl;  // private property, bypasses TypeScript

// Add a setter to Woolball.ts:
// public setWsUrl(url: string): void { this.wsUrl = url; }

// Then in background.js:
woolballClient.setWsUrl(newUrl);
```

## Use Minimal Permissions

Request only the permissions the extension actually needs. Prefer `optional_host_permissions` for server URLs entered by the user — this way the extension does not hold broad WebSocket permissions until the user explicitly grants them.

```json
{
  "permissions": ["storage"],
  "optional_host_permissions": ["ws://*/*", "wss://*/*"]
}
```

## Content Security Policy

Extension pages must define a strict CSP in `manifest.json`. Do not use `unsafe-inline` or `unsafe-eval`.

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

## Persist Settings with chrome.storage

Use `chrome.storage.sync` (synced across devices) or `chrome.storage.local` for persisting user preferences. Do not use `localStorage` — it is not available in service workers and its quota is separate from extension storage.

```js
// Save:
chrome.storage.sync.set({ serverUrl: validatedUrl });

// Load:
chrome.storage.sync.get(['serverUrl'], ({ serverUrl }) => {
  if (serverUrl) connectToServer(serverUrl);
});
```

## Build for Release

Before submitting to the Chrome Web Store, build with `NODE_ENV=production`. This enables minification and disables source maps.

```sh
NODE_ENV=production npx webpack --config chrome-extension/webpack.config.js
```
