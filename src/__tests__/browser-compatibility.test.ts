/**
 * Tests for browser compatibility detection
 */

import { isSupportedBrowser, verifyBrowserCompatibility, BrowserCompatibilityError } from '../utils';

describe('Browser Compatibility', () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    // Restore the original navigator after each test
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  describe('isSupportedBrowser', () => {
    test('should return true when WebGPU is available', () => {
      Object.defineProperty(global, 'navigator', {
        value: { ...originalNavigator, gpu: {} },
        writable: true,
      });

      expect(isSupportedBrowser()).toBe(true);
    });

    test('should return true when WebAssembly is available (no WebGPU)', () => {
      Object.defineProperty(global, 'navigator', {
        value: { ...originalNavigator },
        writable: true,
      });
      // WebAssembly is available in Node.js/jsdom by default
      expect(isSupportedBrowser()).toBe(true);
    });

    test('should return false when not in browser environment', () => {
      const originalWindow = global.window;
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
      });

      expect(isSupportedBrowser()).toBe(false);

      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
      });
    });
  });

  describe('verifyBrowserCompatibility', () => {
    test('should not throw when WebGPU is available', () => {
      Object.defineProperty(global, 'navigator', {
        value: { ...originalNavigator, gpu: {} },
        writable: true,
      });

      expect(() => verifyBrowserCompatibility()).not.toThrow();
    });

    test('should not throw when WebAssembly is available', () => {
      Object.defineProperty(global, 'navigator', {
        value: { ...originalNavigator },
        writable: true,
      });

      expect(() => verifyBrowserCompatibility()).not.toThrow();
    });
  });
});
