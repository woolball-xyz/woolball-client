---
name: run-tests
description: "Build and run woolball-client tests: unit tests (Jest), E2E tests (Playwright), lint."
user_invocable: true
---

# /run-tests

## Commands

```bash
# Build TypeScript
npm run build

# Rebuild worker bundle (if task processors changed)
npm run build:worker

# Run unit tests
npm test

# Run E2E tests (requires built app + Playwright browsers)
npm run test:e2e

# Lint browser-ui
cd browser-ui && npm run lint
```

## Important Notes

- E2E tests run on Chromium only (WebGPU requirement)
- Always rebuild worker before testing if you changed anything in `src/utils/tasks/` or `src/providers/worker.ts`
- Unit tests mock the Worker — see `src/__tests__/mocks/worker-mock.ts`
