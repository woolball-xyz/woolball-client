/**
 * Unit tests for the Woolball class
 */

import Woolball from '../providers/Woolball';
import { MockWorker, setupWorkerMock, cleanupWorkerMock } from './mocks/worker-mock';

// Setup worker mocks before tests

describe('Woolball', () => {
  let originalConsoleError: typeof console.error;
  
  beforeAll(() => {
    // Save original console.error
    originalConsoleError = console.error;
    // Mock console.error to prevent noise in test output
    console.error = jest.fn();
    // Setup worker mocks
    setupWorkerMock();
  });
  
  afterAll(() => {
    // Restore original console.error
    console.error = originalConsoleError;
    // Clean up worker mocks
    cleanupWorkerMock();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should register workers on initialization', () => {
    // Act
    const woolball = new Woolball('1');
    
    // Assert - Check if the worker was registered with the correct path
    // @ts-ignore - Accessing private property for testing
    expect(woolball.workers.has('speech-to-text')).toBe(true);
    // @ts-ignore - Accessing private property for testing
    const worker = woolball.workers.get('speech-to-text');
    expect(worker).toBeInstanceOf(MockWorker);
    // Cast to unknown first to avoid TypeScript error
    expect((worker as unknown as MockWorker).url).toBe('/dist/transformers-js.js');
  });
  
  test('should process events and return results', async () => {
    // Arrange
    const woolball = new Woolball('1');
    const event = {
      key: 'speech-to-text',
      value: JSON.stringify({
        id: '12345',
        input: 'base64AudioData',
        model: 'test-model'
      })
    };
    
    // Act
    const result = await woolball.processEvent('automatic-speech-recognition',event);
    
    // Assert
    expect(result).toEqual({ result: 'mocked result' });
  });
  
  test('should throw error when worker not found', async () => {
    // Arrange
    const woolball = new Woolball('1');
    const event = {
      key: 'non-existent-worker',
      value: 'test'
    };
    
    // Act & Assert
    await expect(woolball.processEvent('automatic-speech-recognition',event)).rejects.toThrow(
      'Worker not found for key: non-existent-worker'
    );
  });
  
  test('should handle worker errors', async () => {
    // Arrange
    const woolball = new Woolball('1');
    const event = {
      key: 'speech-to-text',
      value: 'test'
    };
    
    // @ts-ignore - Accessing private property for testing
    const worker = woolball.workers.get('speech-to-text') as MockWorker;
    
    // Create a custom error to be thrown
    const workerError = new Error('Worker error');
    
    // Override the postMessage method to trigger an error
    jest.spyOn(worker, 'postMessage').mockImplementation(() => {
      // Immediately trigger the error event
      // We need to make sure the error is triggered before the promise resolves
      const errorEvent = new ErrorEvent('error', { error: workerError });
      
      // Force the error to be thrown in the next event loop tick
      // This ensures the error handlers are already set up in the Promise
      setTimeout(() => {
        // Use the triggerError method instead of accessing private listeners property
        worker.triggerError(errorEvent);
      }, 0);
    });
    
    // Act & Assert
    // O processEvent deve rejeitar a Promise com o errorEvent
    await expect(woolball.processEvent('automatic-speech-recognition',event)).rejects.toEqual(
      expect.objectContaining({
        error: workerError
      })
    );
  });
  });
