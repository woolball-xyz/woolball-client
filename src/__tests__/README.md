# Testing Documentation

## Overview

This directory contains unit tests for the Woolball library components. The tests are organized to verify the functionality of individual components as well as their integration.

## Test Structure

- `Woolball.test.ts`: Tests for the main Woolball class that manages web workers
- `worker.test.ts`: Tests for the speech-to-text worker functionality
- `media.test.ts`: Tests for the audio processing utilities
- `mocks/worker-mock.ts`: Mock implementation of Web Worker API for testing

## Running Tests

To run all unit tests:

```bash
npm test
```

To run a specific test file:

```bash
npm test -- src/__tests__/Woolball.test.ts
```

## E2E Tests

End-to-end tests are located in the `e2e-tests` directory and can be run with:

```bash
npm run test:e2e
```

## Test Coverage

The tests cover:

1. **Woolball Class**:
   - Worker registration
   - Event processing
   - Error handling

2. **Speech-to-Text Worker**:
   - Audio data processing
   - Integration with Hugging Face transformers
   - Message handling

3. **Media Utilities**:
   - Audio processing for both mono and stereo inputs

4. **E2E Workflow**:
   - Complete speech-to-text conversion process
   - UI interaction
   - Error handling

## Mocking Strategy

The tests use Jest's mocking capabilities to isolate components:

- Web Worker API is mocked to enable testing in Node.js environment
- Hugging Face transformers are mocked to avoid actual model loading
- WaveFile library is mocked to avoid actual audio processing

This approach allows for fast, reliable tests that don't depend on external services or browser environments.