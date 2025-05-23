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
    

    // Execute the isChromeBased function in the browser context
    const detectedAsChromeBased = await page.evaluate(() => {
      // @ts-ignore - window.Woolball will be defined in the test page
      console.log('window.Woolball.isChromeBased():', window.Woolball.isChromeBased); // Add this line to log the result for debugging
      // @ts-ignore - window.Woolball will be defined in the test page
      return window.Woolball.isChromeBased();
    });
    
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
    
    // The verification should succeed only for Chrome-based browsers
    expect(result.success).toBe(isActuallyChromeBased);
    
    // Additional check to ensure our test is working correctly
    if (browserName === 'chromium') {
      expect(result.success).toBe(true);
    } else if (browserName === 'firefox' || browserName === 'webkit') {
      expect(result.success).toBe(false);
      expect(result.error).toContain('Woolball is only compatible with Chrome-based browsers. Please use Chrome, Chromium, Edge, or another Chrome-based browser.');
    }
  });
});