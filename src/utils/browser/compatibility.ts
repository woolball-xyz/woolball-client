/**
 * Browser compatibility detection module
 * Provides utilities to check if the browser is compatible with browser-node
 */

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
 * Checks if the current browser is Chrome-based
 * @returns {boolean} True if browser is Chrome-based, false otherwise
 */
export function isChromeBased(): boolean {
  if (typeof window === 'undefined' || !window.navigator) {
    // Not in a browser environment
    return false;
  }
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return (
    userAgent.includes('chrome') || 
    userAgent.includes('chromium') || 
    userAgent.includes('edge')
  );
}

/**
 * Verifies browser compatibility and throws an error if not compatible
 * @throws {BrowserCompatibilityError} If browser is not Chrome-based
 */
export function verifyBrowserCompatibility(): void {
  if (!isChromeBased()) {
    throw new BrowserCompatibilityError(
      'browser-node is only compatible with Chrome-based browsers. ' +
      'Please use Chrome, Chromium, Edge, or another Chrome-based browser.'
    );
  }
}

// Automatically verify browser compatibility when the library is loaded
// Skip verification during testing
export function initBrowserCompatibility(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
    verifyBrowserCompatibility();
  }
}