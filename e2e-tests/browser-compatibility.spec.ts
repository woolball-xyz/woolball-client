import { test, expect, BrowserContext } from '@playwright/test';

// Helper function to check if the current browser is Chrome-based
async function isChromeBasedBrowser(page: any): Promise<boolean> {
  const userAgent = await page.evaluate(() => navigator.userAgent.toLowerCase());
  return userAgent.includes('chrome') || userAgent.includes('chromium') || userAgent.includes('edge');
}

test.describe('Browser Compatibility Tests', () => {
  test('should detect Chrome-based browsers correctly', async ({ page, browserName }) => {
    // Load the test page that imports and uses our library
    await page.goto('/');
    
    // Check if the current browser is actually Chrome-based
    const isActuallyChromeBased = await isChromeBasedBrowser(page);
    
    // Execute the isChromeBased function in the browser context
    const detectedAsChromeBased = await page.evaluate(() => {
      // @ts-ignore - window.browserNode will be defined in the test page
      return window.browserNode.isChromeBased();
    });
    
    // The library's detection should match the actual browser type
    expect(detectedAsChromeBased).toBe(isActuallyChromeBased);
    
    // Additional check to ensure our test is working correctly
    if (browserName === 'chromium') {
      expect(detectedAsChromeBased).toBe(true);
    } else if (browserName === 'firefox' || browserName === 'webkit') {
      expect(detectedAsChromeBased).toBe(false);
    }
  });
  
  test('should not throw error when using Chrome-based browser', async ({ page, browserName }) => {
    // Load the test page
    await page.goto('/');
    
    // Check if the current browser is actually Chrome-based
    const isActuallyChromeBased = await isChromeBasedBrowser(page);
    
    // Execute the verification function and check if it throws
    const result = await page.evaluate(() => {
      try {
        // @ts-ignore - window.browserNode will be defined in the test page
        window.browserNode.verifyBrowserCompatibility();
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        };
      }
    });
    
    // The verification should succeed only for Chrome-based browsers
    expect(result.success).toBe(isActuallyChromeBased);
    
    // Additional check to ensure our test is working correctly
    if (browserName === 'chromium') {
      expect(result.success).toBe(true);
    } else if (browserName === 'firefox' || browserName === 'webkit') {
      expect(result.success).toBe(false);
      expect(result.error).toContain('browser-node is only compatible with Chrome-based browsers');
    }
  });
});