import { test } from '@playwright/test';

/**
 * Manual verification screenshot for insights page
 * This script takes a final verification screenshot showing the working page
 */
test('take manual verification screenshot of insights page', async ({ page }) => {
  console.log('📸 Taking manual verification screenshot of insights page...');
  
  // Navigate to insights page
  await page.goto('http://localhost:3001/insights');
  
  // Wait for everything to load
  await page.waitForLoadState('networkidle');
  
  // Wait a bit more for any animations or async content
  await page.waitForTimeout(3000);
  
  // Take a full page screenshot
  await page.screenshot({ 
    path: 'screenshots/insights-page-final-verification.png',
    fullPage: true 
  });
  
  console.log('✅ Final verification screenshot saved: screenshots/insights-page-final-verification.png');
  
  // Get some basic info about the page
  const title = await page.title();
  const heading = await page.locator('h1').textContent();
  const generateButtons = await page.locator('button').filter({ hasText: /generate|insight/i }).count();
  
  console.log('📊 Page verification info:');
  console.log(`   Title: ${title}`);
  console.log(`   Main heading: ${heading}`);
  console.log(`   Generate buttons found: ${generateButtons}`);
});