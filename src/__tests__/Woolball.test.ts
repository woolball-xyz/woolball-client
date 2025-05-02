/**
 * Unit tests for the Woolball class
 */

import Woolball from '../providers/Woolball';
import { MockWorker, setupWorkerMock, cleanupWorkerMock } from './mocks/worker-mock';

// Setup worker mocks before tests

describe('Woolball', () => {
  let originalConsoleError: typeof console.error;
  let originalNavigator: typeof global.navigator;
  
  beforeAll(() => {
    // Save original console.error
    originalConsoleError = console.error;
    // Mock console.error to prevent noise in test output
    console.error = jest.fn();
    // Setup worker mocks
    setupWorkerMock();
    
    // Mock browser environment
    originalNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      writable: true,
    });
  });
  
  afterAll(() => {
    // Restore original console.error
    console.error = originalConsoleError;
    // Clean up worker mocks
    cleanupWorkerMock();
    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should register workers on initialization', () => {
    // Act
    const woolball = new Woolball('1');
    
    // Assert - Check if the worker was registered with the correct path
    // @ts-ignore - Accessing private property for testing
    expect(woolball.workers.has('speech-recognition')).toBe(true);
    // @ts-ignore - Accessing private property for testing
    const worker = woolball.workers.get('speech-recognition');
    expect(worker).toBeInstanceOf(MockWorker);
    // Cast to unknown first to avoid TypeScript error
    expect((worker as unknown as MockWorker).url).toBe('http://localhost/node_modules/woolball-client/dist/transformers-js.js');
  });
  
  test('should process events and return results', async () => {
    // Arrange
    const woolball = new Woolball('1');
    const event = {
      key: 'speech-recognition',
      value: JSON.stringify({
        id: '12345',
        input: 'base64AudioData',
        model: 'test-model'
      })
    };
    
    // Act
    const result = await woolball.processEvent('speech-recognition', event);
    
    // Assert
    expect(result).toEqual({ text: 'mocked transcription result' });
  });
  
  test('should throw error when worker not found', async () => {
    // Arrange
    const woolball = new Woolball('1');
    const event = {
      key: 'non-existent-worker',
      value: 'test'
    };
    
    // Act & Assert
    await expect(woolball.processEvent('non-existent-worker', event)).rejects.toThrow(
      'Worker not found for key: non-existent-worker'
    );
  });
  
  test('should handle worker errors', async () => {
    // Arrange
    const woolball = new Woolball('1');
    const event = {
      key: 'speech-recognition',
      value: 'test'
    };
    
    // Get the worker instance
    // @ts-ignore - Accessing private property for testing
    const worker = woolball.workers.get('speech-recognition');
    expect(worker).toBeDefined();
    expect(worker).toBeInstanceOf(MockWorker);

    // Create a custom error to be thrown
    const workerError = new Error('Worker error');
    
    // Create a promise that will be rejected when the worker processes the message
    const processPromise = woolball.processEvent('speech-recognition', event);
    
    // Trigger the error after a short delay to ensure the event listeners are set up
    setTimeout(() => {
      // Cast to unknown first to avoid TypeScript error
      ((worker as unknown) as MockWorker).triggerError(new ErrorEvent('error', { error: workerError }));
    }, 0);

    // Assert that the promise is rejected with the error
    await expect(processPromise).rejects.toEqual(
      expect.any(ErrorEvent)
    );
  });
});
