/**
 * Browser compatibility detection module
 * Provides utilities to check if the browser is compatible with browser-node
 */

// Type definition for Chrome extension's chrome object
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        id?: string;
      };
    };
  }
}

/**
 * Error thrown when browser is not compatible with browser-node
 */
export class BrowserCompatibilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BrowserCompatibilityError';
  }
}

/**
 * Checks if the current environment is a Chrome extension
 * @returns {boolean} True if running in a Chrome extension, false otherwise
 */
export function isChromeExtension(): boolean {
  try {
    return typeof window !== 'undefined' && 
           typeof window.chrome !== 'undefined' && 
           window.chrome.runtime !== undefined && 
           window.chrome.runtime.id !== undefined;
  } catch (e) {
    // In service worker environments, accessing window.chrome may throw
    return false;
  }
}

/**
 * Checks if the current browser supports WebGPU or WASM (required for AI inference)
 * @returns {boolean} True if browser supports WebGPU or WASM, false otherwise
 */
export function isSupportedBrowser(): boolean {
  try {
    // Chrome extensions are always supported
    if (isChromeExtension()) {
      return true;
    }

    if (typeof window === 'undefined' || !window.navigator) {
      return false;
    }

    // Feature detection: check for WebGPU or WebAssembly support
    const hasWebGPU = 'gpu' in navigator;
    const hasWasm = typeof WebAssembly !== 'undefined';
    return hasWebGPU || hasWasm;
  } catch (e) {
    return false;
  }
}

/**
 * Verifies browser compatibility and throws an error if not compatible
 * @throws {BrowserCompatibilityError} If browser is not Chrome-based
 */
export function verifyBrowserCompatibility(): void {
  try {
    // Chrome extensions are always compatible
    if (isChromeExtension()) {
      return;
    }

    if (!isSupportedBrowser()) {
      throw new BrowserCompatibilityError(
        'browser-node requires a browser with WebGPU or WebAssembly support. ' +
        'Please use Chrome, Edge, Safari, or another modern browser.'
      );
    }
  } catch (e) {
    if (e instanceof BrowserCompatibilityError) {
      throw e;
    }
    // In service worker environments, skip compatibility check
    console.warn('Skipping browser compatibility check in service worker environment');
  }
}

// Automatically verify browser compatibility when the library is loaded
// Skip verification during testing
export function initBrowserCompatibility(): void {
  try {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
      verifyBrowserCompatibility();
    }
  } catch (e) {
    // In service worker environments, skip compatibility initialization
    console.warn('Skipping browser compatibility initialization in service worker environment');
  }
}