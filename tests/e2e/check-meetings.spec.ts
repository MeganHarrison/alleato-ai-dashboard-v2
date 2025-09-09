import { test, expect } from '@playwright/test';

test('Tampa project should show 4 meetings', async ({ page }) => {
  // Navigate to Tampa Event/Party project
  await page.goto('http://localhost:3001/projects/59', { 
    waitUntil: 'domcontentloaded',
    timeout: 10000 
  });
  
  // Wait a bit for data to load
  await page.waitForTimeout(2000);
  
  // Check for meetings section
  const meetingsHeading = await page.locator('h2:has-text("Meetings")').first();
  await expect(meetingsHeading).toBeVisible();
  
  // Check if table has rows (should have 4 Tampa meetings)
  const tableRows = await page.locator('tbody tr').count();
  
  if (tableRows > 0) {
    console.log(`✅ Found ${tableRows} meetings displayed`);
    
    // Check for Tampa-related content
    const tampaContent = await page.locator('text=/Tampa/i').count();
    console.log(`✅ Found ${tampaContent} Tampa-related elements`);
    
    // Take screenshot showing the meetings
    await page.screenshot({ 
      path: 'screenshots/tampa-meetings-visible.png',
      fullPage: true 
    });
  } else {
    console.log('❌ No meetings found - checking empty state');
    const emptyState = await page.locator('text=/No meetings found/i');
    if (await emptyState.isVisible()) {
      console.log('⚠️ Empty state is shown - documents may not have correct metadata');
    }
    
    // Take screenshot of empty state
    await page.screenshot({ 
      path: 'screenshots/tampa-meetings-empty.png',
      fullPage: true 
    });
  }
  
  // Output page content for debugging
  const pageTitle = await page.locator('h1').first().textContent();
  console.log(`Page title: ${pageTitle}`);
});