import { test, expect } from '@playwright/test';

/**
 * Quick verification test for insights page after setOpen fix
 */
test('insights page loads successfully and screenshot', async ({ page }) => {
  console.log('🚀 Testing insights page after setOpen fix...');
  
  // Navigate to insights page
  await page.goto('http://localhost:3008/insights');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  
  // Verify page doesn't have error in title
  await expect(page).not.toHaveTitle(/500|404|Error/);
  
  // Take screenshot for documentation
  await page.screenshot({ 
    path: 'screenshots/insights-page-working.png',
    fullPage: true 
  });
  
  console.log('📸 Screenshot saved to screenshots/insights-page-working.png');
  
  // Verify main content is visible
  const body = page.locator('body');
  await expect(body).toBeVisible();
  
  // Look for insight generator button or similar component
  const insightButton = page.locator('button').filter({ hasText: /generate|insight/i });
  if (await insightButton.count() > 0) {
    console.log('✅ Found insight generator button');
    await insightButton.first().click();
    
    // Wait briefly for any modal/dialog
    await page.waitForTimeout(2000);
    
    // Take another screenshot with dialog open if it exists
    const dialog = page.locator('[role="dialog"]');
    if (await dialog.count() > 0) {
      await page.screenshot({ 
        path: 'screenshots/insights-page-with-dialog.png',
        fullPage: true 
      });
      console.log('📸 Dialog screenshot saved');
    }
  }
  
  console.log('✅ Insights page test completed successfully!');
});