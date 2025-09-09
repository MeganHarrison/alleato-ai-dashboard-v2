import { test, expect } from '@playwright/test';

/**
 * Simple test to capture the current state of the project documents page
 * and verify what's actually being displayed.
 */

test('Project Documents Page - Current State Analysis', async ({ page }) => {
  console.log('🔍 Testing current state of project documents page...');

  // Navigate to project page
  console.log('📍 Navigating to /projects/1');
  await page.goto('http://localhost:4000/projects/1');
  
  // Wait for page to load
  console.log('⏳ Waiting for page to load...');
  await page.waitForTimeout(3000);

  // Take a screenshot immediately to see what we have
  await page.screenshot({
    path: 'screenshots/project-documents-current-state.png',
    fullPage: true
  });
  console.log('📸 Initial screenshot taken');

  // Check for any error messages
  const errors = page.locator('.error, [class*="error"], [role="alert"]');
  const errorCount = await errors.count();
  console.log(`⚠️ Found ${errorCount} error elements`);
  
  // Also check for specific error text
  const specificErrors = page.locator('text=Something went wrong, text=error, text=Error');
  const specificErrorCount = await specificErrors.count();
  console.log(`⚠️ Found ${specificErrorCount} specific error texts`);
  
  if (errorCount > 0 || specificErrorCount > 0) {
    try {
      const errorTexts = await errors.allTextContents();
      const specificErrorTexts = await specificErrors.allTextContents();
      console.log('📋 Error messages:', [...errorTexts, ...specificErrorTexts]);
    } catch (e) {
      console.log('📋 Could not extract error texts');
    }
    
    // Try clicking on "Error Details" to see more info
    const errorDetails = page.locator('text=Error Details, [aria-expanded="false"]:has-text("Error")');
    if (await errorDetails.count() > 0) {
      console.log('🔍 Found Error Details, clicking...');
      await errorDetails.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({
        path: 'screenshots/project-documents-error-details.png',
        fullPage: true
      });
      console.log('📸 Error details screenshot taken');
    }
    
    // Click "Try Again" if it exists
    const tryAgainButton = page.locator('button:has-text("Try Again"), button:has-text("Reload")');
    if (await tryAgainButton.count() > 0) {
      console.log('🔄 Found Try Again button, clicking...');
      await tryAgainButton.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({
        path: 'screenshots/project-documents-after-retry.png',
        fullPage: true
      });
      console.log('📸 Screenshot after retry taken');
    }
  }

  // Look for any headings
  const headings = page.locator('h1, h2, h3, h4, h5, h6');
  const headingCount = await headings.count();
  console.log(`📋 Found ${headingCount} headings`);
  
  if (headingCount > 0) {
    const headingTexts = await headings.allTextContents();
    console.log('📄 Headings found:', headingTexts);
  }

  // Look for any tables
  const tables = page.locator('table, [role="table"]');
  const tableCount = await tables.count();
  console.log(`📊 Found ${tableCount} tables`);

  // Look for table headers specifically
  const tableHeaders = page.locator('th, [role="columnheader"]');
  const headerCount = await tableHeaders.count();
  console.log(`📋 Found ${headerCount} table headers`);
  
  if (headerCount > 0) {
    const headerTexts = await tableHeaders.allTextContents();
    console.log('📄 Table headers:', headerTexts);
  }

  // Look for table rows
  const tableRows = page.locator('tbody tr, [role="row"]:not([role="rowheader"])');
  const rowCount = await tableRows.count();
  console.log(`📊 Found ${rowCount} table rows`);

  // Look for document-related text
  const documentText = page.locator('text=/document/i');
  const docTextCount = await documentText.count();
  console.log(`📄 Found ${docTextCount} elements with "document" text`);

  // Look for buttons
  const buttons = page.locator('button');
  const buttonCount = await buttons.count();
  console.log(`🔘 Found ${buttonCount} buttons`);
  
  if (buttonCount > 0 && buttonCount < 20) { // Only show if reasonable number
    const buttonTexts = await buttons.allTextContents();
    console.log('🔘 Button texts:', buttonTexts.filter(text => text.trim()));
  }

  // Check page title
  const pageTitle = await page.title();
  console.log(`📄 Page title: "${pageTitle}"`);

  // Look for specific key elements
  const keyElements = [
    'Documents',
    'Title',
    'Date', 
    'Summary',
    'Actions',
    'Edit',
    'Download',
    'Delete'
  ];

  for (const element of keyElements) {
    const found = await page.locator(`text="${element}"`).count();
    console.log(`🔍 "${element}": ${found > 0 ? '✅ Found' : '❌ Not found'}`);
  }

  // Take a final comprehensive screenshot
  await page.screenshot({
    path: 'screenshots/project-documents-fixed.png',
    fullPage: true
  });
  console.log('📸 Final comprehensive screenshot taken');

  // Log current URL
  const currentUrl = page.url();
  console.log(`🌐 Current URL: ${currentUrl}`);

  console.log('✅ Test completed - check screenshots folder for results');
});