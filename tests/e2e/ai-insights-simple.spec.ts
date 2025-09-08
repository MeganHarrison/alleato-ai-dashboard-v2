import { test, expect } from '@playwright/test';

test('AI Insights Dashboard - Simple Test and Screenshot', async ({ page }) => {
  console.log('Starting AI Insights Dashboard test...');
  
  // Navigate to the page
  await page.goto('/ai-insights');
  console.log('Navigated to /ai-insights');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  console.log('Page loaded');
  
  // Wait a bit more to ensure everything is rendered
  await page.waitForTimeout(3000);
  
  // Take a screenshot of the current state
  await page.screenshot({ 
    path: 'screenshots/ai-insights-dashboard.png',
    fullPage: true 
  });
  console.log('Screenshot saved to screenshots/ai-insights-dashboard.png');
  
  // Check if we can find any recognizable elements
  const pageContent = await page.textContent('body');
  console.log('Page contains text, length:', pageContent?.length || 0);
  
  // Look for common dashboard elements
  const headings = await page.$$('h1, h2, h3');
  console.log('Found headings:', headings.length);
  
  for (let i = 0; i < headings.length && i < 5; i++) {
    const text = await headings[i].textContent();
    console.log(`Heading ${i+1}: "${text}"`);
  }
  
  // Look for navigation/tabs
  const tabs = await page.$$('[role="tab"], .tab, [class*="tab"]');
  console.log('Found tab elements:', tabs.length);
  
  // Look for buttons
  const buttons = await page.$$('button');
  console.log('Found buttons:', buttons.length);
  
  console.log('✅ Basic page analysis complete');
});