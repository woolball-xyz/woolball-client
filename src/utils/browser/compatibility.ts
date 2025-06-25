/**
 * Browser compatibility detection module
 * Provides utilities to check if the browser is compatible with browser-node
 */

// Definição de tipo para o objeto chrome das extensões do Chrome
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
    // Em ambientes de service worker, acessar window.chrome pode lançar exceções
    return false;
  }
}

/**
 * Checks if the current browser is Chrome-based
 * @returns {boolean} True if browser is Chrome-based, false otherwise
 */
export function isChromeBased(): boolean {
  try {
    // Se estamos em uma extensão Chrome, retornamos true diretamente
    if (isChromeExtension()) {
      return true;
    }
    
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
  } catch (e) {
    // Em ambientes de service worker, acessar window.navigator pode lançar exceções
    return false;
  }
}

/**
 * Verifies browser compatibility and throws an error if not compatible
 * @throws {BrowserCompatibilityError} If browser is not Chrome-based
 */
export function verifyBrowserCompatibility(): void {
  try {
    // Se estamos em uma extensão Chrome, não precisamos verificar compatibilidade
    if (isChromeExtension()) {
      return;
    }
    
    if (!isChromeBased()) {
      throw new BrowserCompatibilityError(
        'browser-node is only compatible with Chrome-based browsers. ' +
        'Please use Chrome, Chromium, Edge, or another Chrome-based browser.'
      );
    }
  } catch (e) {
    // Em ambientes de service worker, não lançamos erro de compatibilidade
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
    // Em ambientes de service worker, não inicializamos a verificação de compatibilidade
    console.warn('Skipping browser compatibility initialization in service worker environment');
  }
}