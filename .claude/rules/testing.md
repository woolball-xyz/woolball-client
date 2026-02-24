---
description: "Testing guidelines: correct API references, meaningful assertions, mock patterns, E2E scope."
globs: "{src/__tests__/**,e2e-tests/**,**/*.test.ts,**/*.spec.ts}"
---

# Testing Guidelines

## Verify API Before Writing Tests

Before writing a test, read the source file you are testing. Verify method names, property names, return types, and import paths. Using a wrong property name or key silently tests nothing — the test may pass while the feature is broken.

Key facts to check in `src/providers/Woolball.ts` and `src/utils/tasks/index.ts` before testing:
- The correct task type strings (e.g. `'automatic-speech-recognition'`, not `'speech-recognition'`)
- Whether a property is public or private
- The actual import path for workers (`'../providers/worker'`, not `'../providers/transformers-js/worker'`)

## How processEvent Signals Errors

`processEvent` resolves with `{ error: string }` on worker failure — it does not reject. Write error case assertions against the resolved value.

```ts
// Testing an error case:
const result = await woolball.processEvent(key, event);
expect(result).toHaveProperty('error');
expect(typeof (result as { error: string }).error).toBe('string');
```

## Write Meaningful Assertions

Each assertion must verify a specific, observable property of the result. An assertion that cannot fail when the code is broken is not a useful test.

```ts
// Too weak — passes even if processEvent returns undefined:
expect(result).toBeDefined();

// Meaningful — fails if the shape or value is wrong:
expect(result).toEqual({ text: 'mocked transcription result' });
```

## Verify Tests Actually Fail When Code Breaks

Before committing a test, briefly check that it fails when you break the implementation (rename a method, change a return value). A test that always passes regardless of the implementation gives false confidence.

## Mock Cleanup in afterEach / afterAll

Every mock, timer replacement, and global override introduced in a test file must be restored in `afterEach` or `afterAll`. Leaking mocks across test files causes non-deterministic failures.

```ts
afterAll(() => {
  console.error = originalConsoleError;
  Object.defineProperty(global, 'navigator', {
    value: originalNavigator,
    writable: true,
  });
});
```

## E2E Tests Target Chrome Only

The woolball-client library requires Chrome (WebGPU). Playwright E2E tests must use only the `chromium` project. Do not add Firefox or Safari to `playwright.config.ts`.

```ts
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
],
```

## Use Real Mocks for Workers

Unit tests for `Woolball` need a `Worker` mock. Place the mock in `src/__tests__/mocks/` and import it in each test that requires it. The mock must simulate both successful message responses and error events.

## Coverage Thresholds

Add coverage thresholds to `jest.config.js` to catch regressions when lines are removed or branches go untested.

```js
coverageThreshold: {
  global: {
    branches: 60,
    functions: 60,
    lines: 60,
  },
},
```
