import { test, expect, BrowserContext } from '@playwright/test';

// Helper function to check if the current browser supports WebGPU/WASM
async function isSupportedBrowserCheck(page: any): Promise<boolean> {
  const userAgent = await page.evaluate(() => navigator.userAgent.toLowerCase());
  return userAgent.includes('chrome') || userAgent.includes('chromium') || userAgent.includes('edge');
}

test.describe('Browser Compatibility Tests', () => {
  test('should detect supported browsers correctly', async ({ page, browserName }) => {
    // Load the test page that imports and uses our library
    await page.goto('/');

    // Execute the isSupportedBrowser function in the browser context
    const detectedAsSupported = await page.evaluate(() => {
      // @ts-ignore - window.Woolball will be defined in the test page
      return window.Woolball.isSupportedBrowser();
    });

    // Additional check to ensure our test is working correctly
    if (browserName === 'chromium') {
      expect(detectedAsSupported).toBe(true);
    } else if (browserName === 'firefox' || browserName === 'webkit') {
      expect(detectedAsSupported).toBe(false);
    }
  });

  test('should not throw error when using supported browser', async ({ page, browserName }) => {
    // Load the test page
    await page.goto('/');

    // Check if the current browser is actually supported
    const isActuallySupported = await isSupportedBrowserCheck(page);

    // Execute the verification function and check if it throws
    const result = await page.evaluate(() => {
      try {
        // @ts-ignore - window.Woolball will be defined in the test page
        window.Woolball.verifyBrowserCompatibility();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    });

    // The verification should succeed only for supported browsers
    expect(result.success).toBe(isActuallySupported);

    // Additional check to ensure our test is working correctly
    if (browserName === 'chromium') {
      expect(result.success).toBe(true);
    } else if (browserName === 'firefox' || browserName === 'webkit') {
      expect(result.success).toBe(false);
      expect(result.error).toContain('browser-node requires a browser with WebGPU or WebAssembly support.');
    }
  });
});
