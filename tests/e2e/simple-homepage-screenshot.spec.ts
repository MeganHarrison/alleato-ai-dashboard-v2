import { test, expect } from '@playwright/test';

test.describe('Homepage Screenshot Capture', () => {
  test('capture homepage screenshot for verification', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:3002');
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Set a good viewport size for screenshots
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Wait for any dynamic content to load
    await page.waitForTimeout(3000);
    
    // Take the screenshot
    await page.screenshot({
      path: '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots/homepage-final-verification.png',
      fullPage: true,
      quality: 90
    });
    
    console.log('✅ Screenshot saved as homepage-final-verification.png');
    
    // Always pass - we just want the screenshot
    expect(true).toBe(true);
  });
});