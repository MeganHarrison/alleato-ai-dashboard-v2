import { test, expect, Page } from '@playwright/test';

test.describe('Documents Table Page', () => {
  test('should display documents table with all functionality', async ({ page }) => {
    // Navigate to documents page
    await page.goto('/documents');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // 1. Verify the table view displays with correct columns
    console.log('✓ Testing table columns...');
    await expect(page.locator('table')).toBeVisible();
    
    // Check for expected column headers
    const columnHeaders = [
      'Name',
      'Date', 
      'Summary',
      'Project',
      'AI Insights',
      'Actions'
    ];
    
    for (const header of columnHeaders) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
    }
    
    // 2. Verify documents are displayed in the table
    console.log('✓ Checking for document rows...');
    const documentRows = page.locator('tbody tr');
    const rowCount = await documentRows.count();
    console.log(`Found ${rowCount} document rows`);
    
    if (rowCount > 0) {
      // 3. Check for documents without AI insights (Generate button)
      console.log('✓ Checking AI insights status...');
      const generateButtons = page.locator('button:has-text("Generate")');
      const generatedBadges = page.locator('text=Generated');
      
      const generateButtonCount = await generateButtons.count();
      const generatedBadgeCount = await generatedBadges.count();
      
      console.log(`Documents without AI insights: ${generateButtonCount}`);
      console.log(`Documents with AI insights: ${generatedBadgeCount}`);
      
      // 4. Verify alert banner if there are documents without insights
      if (generateButtonCount > 0) {
        console.log('✓ Checking for alert banner...');
        const alertBanner = page.locator('[role="alert"]');
        await expect(alertBanner).toBeVisible();
      }
      
      // 5. Test search functionality
      console.log('✓ Testing search functionality...');
      const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="filter" i]');
      if (await searchInput.count() > 0) {
        await searchInput.first().fill('test');
        await page.waitForTimeout(1000); // Wait for search to process
        await searchInput.first().clear();
      }
      
      // 6. Test column visibility toggle
      console.log('✓ Testing column visibility...');
      const columnsButton = page.locator('button:has-text("Columns")');
      if (await columnsButton.count() > 0) {
        await columnsButton.click();
        await page.waitForTimeout(500);
        // Close the dropdown by clicking elsewhere
        await page.click('body');
      }
      
      // 7. Test clicking on a document name
      console.log('✓ Testing document name click...');
      const firstDocumentLink = page.locator('tbody tr:first-child td:first-child a, tbody tr:first-child td:first-child button');
      if (await firstDocumentLink.count() > 0) {
        // Just hover over it to verify it's clickable, don't actually click to avoid navigation
        await firstDocumentLink.hover();
      }
    } else {
      console.log('No documents found in the table');
    }
    
    // 8. Take screenshot of the complete page
    console.log('✓ Taking screenshot...');
    await page.screenshot({ 
      path: 'screenshots/documents-table-ai-insights.png',
      fullPage: true 
    });
    
    // Log final status
    console.log('✓ Test completed successfully');
    console.log(`Total documents: ${rowCount}`);
    
    // Take additional screenshot focused on the table
    const tableContainer = page.locator('table').first();
    if (await tableContainer.count() > 0) {
      await tableContainer.screenshot({ 
        path: 'screenshots/documents-table-detail.png'
      });
    }
  });
});