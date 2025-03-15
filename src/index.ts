/**
 * browser-node library
 * Provides Node.js-like APIs for Chrome-based browsers
 */

// Import browser compatibility utilities
import { initBrowserCompatibility, isChromeBased, verifyBrowserCompatibility } from './utils/browser';

// Initialize browser compatibility check
initBrowserCompatibility();

// Export browser compatibility utilities for use in browser environments
export { isChromeBased, verifyBrowserCompatibility };

