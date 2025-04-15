# E2E Testing Documentation

## Overview

This directory contains end-to-end tests for the Woolball library. These tests verify the complete functionality of the library in a real browser environment, ensuring that all components work together correctly.

## Test Structure

- `browser-compatibility.spec.ts`: Tests for browser compatibility detection
- `speech-to-text.spec.ts`: Tests for the complete speech-to-text workflow
- `test-page/`: Contains HTML pages used for testing

## Running Tests

To run all E2E tests:

```bash
npm run test:e2e
```

To run a specific test file:

```bash
npx playwright test e2e-tests/speech-to-text.spec.ts
```

To run tests in a specific browser:

```bash
npx playwright test --project=chromium
```

## Test Coverage

The E2E tests cover:

1. **Browser Compatibility**:
   - Detection of Chrome-based browsers
   - Appropriate error handling in non-compatible browsers

2. **Speech-to-Text Workflow**:
   - Loading and processing audio files
   - Displaying transcription results
   - Error handling for failed requests

## Test Environment

The tests run in real browsers using Playwright. The test environment includes:

- A local server serving the demo application
- Test audio files for processing
- Mocked responses where appropriate to ensure test reliability

## Debugging Tests

To debug tests visually:

```bash
DEBUG=pw:api npx playwright test --headed
```

This will run the tests in headed mode, allowing you to see the browser as the tests run.

## CI Integration

These tests are configured to run in CI environments through the GitHub Actions workflow defined in `.github/workflows/ci.yml`.