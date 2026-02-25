---
name: add-task-type
description: "Scaffold a new task type on the client: processor, type registration, TASK_CONFIGS, worker rebuild."
user_invocable: true
---

# /add-task-type

Creates all client-side scaffolding for a new task type.

## Usage

```
/add-task-type <task-type-name>
```

Example: `/add-task-type image-generation`

## What This Creates/Modifies

1. **types.ts** — Adds task type string to `TaskType` union
2. **Task processor** — New file in `src/utils/tasks/ai/{name}.ts` with the standard signature
3. **index.ts** — Registers processor in `taskProcessors` and exports it
4. **TaskAvailability.ts** — Adds entry to `TASK_CONFIGS` with execution types per environment
5. **Rebuilds worker** — Runs `npm run build:worker` to regenerate `worker-string.ts`

## After Running

- The task type string MUST match the server's canonical name exactly
- If the server doesn't support this task type yet, add it there too
- Run `npm test` to check nothing broke
