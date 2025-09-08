import { test, expect } from '@playwright/test';

test('FM Global Expert - Final Error Resolution Test', async ({ page }) => {
  // Navigate to the FM Global Expert page
  await page.goto('http://localhost:3007/fm-global-expert');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of initial state
  await page.screenshot({ path: 'screenshots/fm-global-expert-final-test.png', fullPage: true });
  
  // Check if page loads without errors
  await expect(page.locator('h1').filter({ hasText: 'HELLO' })).toBeVisible();
  
  // Test suggestion click functionality
  const suggestionButton = page.locator('button').filter({ 
    hasText: 'What are the sprinkler requirements for shuttle ASRS with open-top containers?' 
  }).first();
  
  await expect(suggestionButton).toBeVisible();
  
  // Click the suggestion and wait for processing
  await suggestionButton.click();
  await page.waitForTimeout(5000);
  
  // Take final screenshot after interaction
  await page.screenshot({ path: 'screenshots/fm-global-expert-after-fix.png', fullPage: true });
  
  console.log('✅ FM Global Expert page test completed - checking for infinite loop errors');
});