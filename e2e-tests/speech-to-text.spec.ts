import { test, expect } from '@playwright/test';

test.describe('Speech-to-Text E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page instead of demo page
    await page.goto('/e2e-tests/test-page/speech-to-text.html');
    
    // Wait for the page to be fully loaded
    await page.waitForSelector('#convertBtn', { state: 'visible' });
  });

  test('should load the test page with input.wav file', async ({ page }) => {
    // Check if the page loaded correctly
    await expect(page.locator('h1')).toContainText('Speech to Text Demo');
    
    // Check if the input.wav file was loaded automatically
    const statusText = await page.locator('#status').textContent();
    expect(statusText).toContain('input.wav');
    
    // Verify the convert button is enabled
    const isButtonDisabled = await page.locator('#convertBtn').isDisabled();
    expect(isButtonDisabled).toBe(false);
  });

  // test('should process audio file and display transcription result', async ({ page }) => {
  //   // Click the convert button
  //   await page.locator('#convertBtn').click();
    
  //   // Wait for processing to start
  //   await expect(page.locator('#status')).toContainText('Converting audio to text');
  //   await expect(page.locator('#result')).toContainText('Processing');
    
  //   // Wait for processing to complete (may take some time)
  //   await expect(page.locator('#status')).toContainText('Conversão concluída', { timeout: 120000 });
    
  //   // Verify that result contains JSON with transcription
  //   const resultText = await page.locator('#result').textContent();
  //   expect(resultText).toBeTruthy();
    
  //   // Parse the result and check its structure
  //   // Note: We can't predict the exact transcription, but we can verify the structure
  //   try {
  //     const resultJson = JSON.parse(resultText || '{}');
  //     expect(resultJson).toHaveProperty('result');
  //   } catch (e) {
  //     // If parsing fails, the test should fail
  //     expect(false).toBe(true);
  //   }
  // });

  test('should handle errors gracefully', async ({ page, context }) => {
    // Intercept requests to simulate a failure
    await context.route('**/*.wav', route => route.abort());
    
    // Reload the page to trigger the intercepted request
    await page.reload();
    
    // Try to convert without a valid file
    const convertBtn = page.locator('#convertBtn');
    if (!await convertBtn.isDisabled()) {
      await convertBtn.click();
      
      // Check if error message is displayed
      await expect(page.locator('#status')).toContainText('Erro', { timeout: 5000 });
    } else {
      // If button is disabled, that's also a valid error handling
      await expect(page.locator('#status')).not.toContainText('input.wav carregado automaticamente');
    }
  });
});