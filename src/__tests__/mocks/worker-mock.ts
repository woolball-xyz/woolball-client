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
      const response = { data: { text: 'mocked transcription result' } };
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
    this.listeners.error.forEach(callback => callback(error));
  }
}

// Global mock setup
export function setupWorkerMock() {
  // @ts-ignore - Override global Worker class
  global.Worker = MockWorker;
}

// Cleanup function
export function cleanupWorkerMock() {
  // @ts-ignore - Restore global Worker class
  delete global.Worker;
}