---
name: add-provider
description: "Add a new AI provider to an existing task type: handler function, provider switch case, type update."
user_invocable: true
---

# /add-provider

Adds a new AI inference provider to an existing task processor.

## Usage

```
/add-provider <provider-name> <task-type>
```

Example: `/add-provider ollama text-generation`

## What This Creates/Modifies

1. **types.ts** — Adds provider name to `TaskData.provider` union type
2. **Task processor** — Adds `handle{Provider}` function and switch case in the task processor file
3. **Rebuilds worker** — Runs `npm run build:worker`

## Provider Implementation Pattern

```typescript
async function handleNewProvider(
  input: string,
  model: string,
  options: Record<string, any>
): Promise<TaskResult> {
  const library = await import('provider-library');
  // ... initialize and run inference
  return { generatedText: result };
}
```

## Checklist

- Does the provider work in Web Workers? (no DOM access, no `window`)
- Does the provider support WebGPU/WASM? (required for browser execution)
- Should the provider instance be cached? (use module-level variable if model loading is expensive)
- Does it need a fallback? (e.g., prompt-api falls back to transformers)
