/**
 * Mock implementation for Web Worker API in Node.js environment
 * This file provides mocks for the Worker class and related functionality
 * to enable testing of worker-related code in Jest
 */

// Mock Worker class for testing
export class MockWorker {
  private listeners: Record<string, Array<(event: any) => void>> = {
    message: [],
    error: []
  };
  
  constructor(public url: string) {}
  
  addEventListener(type: string, callback: (event: any) => void) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }
  
  removeEventListener(type: string, callback: (event: any) => void) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    }
  }
  
  postMessage(data: any) {
    // Simulate successful response after a short delay
    setTimeout(() => {
      const response = { data: JSON.stringify({ result: 'mocked result' }) };
      this.listeners.message.forEach(callback => callback(response));
    }, 20);
  }
  
  // Add a method to directly set the onmessage handler
  set onmessage(handler: (event: MessageEvent) => void) {
    this.addEventListener('message', handler);
  }
  
  // Add a method to directly set the onerror handler
  set onerror(handler: (event: ErrorEvent) => void) {
    this.addEventListener('error', handler);
  }
  
  // Method to simulate error
  triggerError(error: ErrorEvent) {
    // Make sure the error is properly propagated
    if (this.listeners.error && this.listeners.error.length > 0) {
      this.listeners.error.forEach(callback => callback(error));
    } else {
      // If no error listeners are registered, use onerror if available
      const errorHandler = this.onerror as unknown as ((event: ErrorEvent) => void) | null;
      if (errorHandler) {
        errorHandler(error);
      }
    }
    // Don't throw here as it breaks the tests that expect callbacks
    // Instead, the error will be propagated through the promise rejection in Woolball.processEvent
  }
}

// Setup global mocks for Worker API
export function setupWorkerMock() {
  // Mock global Worker
  global.Worker = MockWorker as any;
  
  // Mock self for worker context
  if (typeof global.self === 'undefined') {
    global.self = {
      postMessage: jest.fn(),
      onmessage: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    } as unknown as typeof self;
  }
}

// Cleanup global mocks
export function cleanupWorkerMock() {
  delete (global as any).Worker;
  delete (global as any).self;
}