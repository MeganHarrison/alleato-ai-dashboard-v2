import { test, expect } from '@playwright/test';

test('basic navigation to PM Assistant', async ({ page }) => {
  // First navigate to home page
  await page.goto('/');
  console.log('Navigated to home page');
  
  // Check if we need to login first
  const url = page.url();
  console.log('Current URL:', url);
  
  if (url.includes('/login')) {
    console.log('Redirected to login page - authentication required');
    // We need to handle authentication
    return;
  }
  
  // Try navigating directly to PM Assistant
  await page.goto('/pm-assistant');
  await page.waitForLoadState('domcontentloaded');
  
  console.log('Final URL:', page.url());
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'pm-assistant-screenshot.png' });
});