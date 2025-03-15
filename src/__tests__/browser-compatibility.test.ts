/**
 * Tests for browser compatibility detection
 */

import { isChromeBased, verifyBrowserCompatibility, BrowserCompatibilityError } from '../utils';

describe('Browser Compatibility', () => {
  const originalNavigator = global.navigator;
  
  afterEach(() => {
    // Restore the original navigator after each test
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });
  
  describe('isChromeBased', () => {
    test('should return true for Chrome browser', () => {
      // Mock Chrome browser
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        writable: true,
      });
      
      expect(isChromeBased()).toBe(true);
    });
    
    test('should return true for Chromium browser', () => {
      // Mock Chromium browser
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chromium/91.0.4472.124 Chrome/91.0.4472.124 Safari/537.36',
        },
        writable: true,
      });
      
      expect(isChromeBased()).toBe(true);
    });
    
    test('should return true for Edge browser', () => {
      // Mock Edge browser
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
        },
        writable: true,
      });
      
      expect(isChromeBased()).toBe(true);
    });
    
    test('should return false for Firefox browser', () => {
      // Mock Firefox browser
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        },
        writable: true,
      });
      
      expect(isChromeBased()).toBe(false);
    });
    
    test('should return false for Safari browser', () => {
      // Mock Safari browser
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        },
        writable: true,
      });
      
      expect(isChromeBased()).toBe(false);
    });
    
    test('should return false when not in browser environment', () => {
      // Mock non-browser environment by temporarily removing window.navigator
      const originalWindow = global.window;
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
      });
      
      expect(isChromeBased()).toBe(false);
      
      // Restore window
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
      });
    });
  });
  
  describe('verifyBrowserCompatibility', () => {
    test('should not throw error for Chrome browser', () => {
      // Mock Chrome browser
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        writable: true,
      });
      
      expect(() => verifyBrowserCompatibility()).not.toThrow();
    });
    
    test('should throw BrowserCompatibilityError for Firefox browser', () => {
      // Mock Firefox browser
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        },
        writable: true,
      });
      
      expect(() => verifyBrowserCompatibility()).toThrow(BrowserCompatibilityError);
      expect(() => verifyBrowserCompatibility()).toThrow(
        'browser-node is only compatible with Chrome-based browsers. ' +
        'Please use Chrome, Chromium, Edge, or another Chrome-based browser.'
      );
    });
  });
});