import { test, expect } from '@playwright/test';

test('Simple project page test', async ({ page }) => {
  // Set a longer timeout
  test.setTimeout(60000);
  
  console.log('🚀 Starting project page test...');
  
  try {
    // Navigate with basic wait
    console.log('📍 Navigating to project page...');
    await page.goto('http://localhost:3010/projects/1', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait a moment for any additional content
    await page.waitForTimeout(2000);
    console.log('✅ Page loaded');
    
    // Take immediate screenshot
    await page.screenshot({ 
      path: 'screenshots/project-page-simple.png',
      fullPage: true 
    });
    console.log('📸 Screenshot taken');
    
    // Get page content to understand what's loaded
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    // Check for any obvious errors
    const errorMessages = await page.locator('text=Error').count();
    console.log('❌ Error messages found:', errorMessages);
    
    // Look for the word "Documents" anywhere on the page
    const documentsText = await page.locator('text=Documents').count();
    console.log('📄 "Documents" text found:', documentsText);
    
    // Look for tables
    const tables = await page.locator('table').count();
    console.log('📋 Tables found:', tables);
    
    // Get all h2 elements
    const h2Elements = await page.locator('h2').allTextContents();
    console.log('🏷️ H2 elements:', h2Elements);
    
    // Check if there's a loading state
    const loadingElements = await page.locator('text=Loading').count();
    console.log('⏳ Loading elements:', loadingElements);
    
    // Save the page HTML for inspection
    const content = await page.content();
    require('fs').writeFileSync('screenshots/project-page-html.html', content);
    console.log('💾 HTML content saved');
    
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    
    // Try to take a screenshot even on failure
    try {
      await page.screenshot({ 
        path: 'screenshots/project-page-error.png',
        fullPage: true 
      });
    } catch (screenshotError) {
      console.error('📸 Could not take error screenshot:', screenshotError);
    }
    
    throw error;
  }
});