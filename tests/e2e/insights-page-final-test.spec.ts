import { test, expect } from '@playwright/test';

/**
 * Final test for insights page after fixing setProgressValue issue
 */
test('insights page loads successfully after fix', async ({ page }) => {
  console.log('🔧 Testing insights page after setProgressValue fix...');
  
  // Navigate to insights page  
  await page.goto('http://localhost:3001/insights');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  
  // Verify page loads without error
  const title = await page.title();
  console.log('📄 Page title:', title);
  expect(title).not.toMatch(/500|404|Error/i);
  
  // Check that main content is visible
  await expect(page.locator('body')).toBeVisible();
  
  // Look for the main heading
  const heading = page.locator('h1');
  if (await heading.count() > 0) {
    const headingText = await heading.first().textContent();
    console.log('📋 Main heading:', headingText);
    expect(headingText).toContain('Insights');
  }
  
  // Take screenshot of working page
  await page.screenshot({ 
    path: 'screenshots/insights-page-fixed.png',
    fullPage: true 
  });
  
  console.log('📸 Screenshot saved: screenshots/insights-page-fixed.png');
  
  // Look for InsightGeneratorButton - try different selectors
  const generateButton = page.locator('button').filter({ hasText: /generate|insight/i });
  
  if (await generateButton.count() > 0) {
    console.log('✅ Found insight generator button');
    
    // Click the button to test dialog
    await generateButton.first().click();
    
    // Wait for dialog to appear
    await page.waitForTimeout(2000);
    
    // Look for dialog
    const dialog = page.locator('[role="dialog"]');
    if (await dialog.count() > 0) {
      console.log('✅ Dialog opened successfully');
      
      // Take screenshot with dialog open
      await page.screenshot({ 
        path: 'screenshots/insights-page-dialog-open.png',
        fullPage: true 
      });
      
      console.log('📸 Dialog screenshot saved: screenshots/insights-page-dialog-open.png');
      
      // Close dialog with ESC key
      await page.keyboard.press('Escape');
    }
  } else {
    console.log('ℹ️  No generate button found - may be no documents to process');
  }
  
  console.log('🎉 Insights page test completed successfully!');
});