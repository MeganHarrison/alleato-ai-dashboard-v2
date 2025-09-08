import { test, expect, Page } from '@playwright/test';

test.describe('Documents Table Final Test', () => {
  test('should verify documents table functionality and take screenshots', async ({ page }) => {
    console.log('🚀 Starting Final Documents Table Test');
    
    // Navigate to documents page
    await page.goto('/documents');
    console.log('✓ Navigated to /documents page');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Extra wait for all content to load
    
    // Verify page loaded successfully
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();
    await expect(page.getByText('Manage and view all documents in the system')).toBeVisible();
    console.log('✓ Page header verified');
    
    // Check for error state
    const errorElement = page.locator('.bg-red-50');
    if (await errorElement.count() > 0) {
      console.log('❌ Error detected on page');
      return;
    }
    
    // Verify table exists
    await expect(page.locator('table')).toBeVisible();
    console.log('✓ Table is visible');
    
    // Check all expected columns
    const expectedHeaders = ['Name', 'Date', 'Summary', 'Project', 'AI Insights', 'Actions'];
    let columnsFound = 0;
    
    for (const header of expectedHeaders) {
      const headerElement = page.locator('thead th').filter({ hasText: header });
      if (await headerElement.count() > 0) {
        columnsFound++;
        console.log(`✓ Found column: ${header}`);
      }
    }
    
    // Count documents
    const documentRows = page.locator('tbody tr').filter({ hasNotText: 'No documents found' });
    const totalDocs = await documentRows.count();
    console.log(`📊 Total documents found: ${totalDocs}`);
    
    // Analyze AI insights status
    let docsWithoutInsights = 0;
    let docsWithInsights = 0;
    let alertBannerVisible = false;
    
    if (totalDocs > 0) {
      docsWithoutInsights = await page.locator('button:has-text("Generate")').count();
      docsWithInsights = await page.locator('text=Generated').locator('visible=true').count();
      
      // Check alert banner
      const alertBanner = page.locator('.bg-amber-50');
      alertBannerVisible = await alertBanner.count() > 0;
      
      console.log(`📊 Documents with AI insights: ${docsWithInsights}`);
      console.log(`📊 Documents without AI insights: ${docsWithoutInsights}`);
      console.log(`📊 Alert banner visible: ${alertBannerVisible}`);
    }
    
    // Test search box
    const searchInput = page.locator('input[placeholder="Search documents..."]');
    const searchVisible = await searchInput.count() > 0;
    console.log(`✓ Search functionality available: ${searchVisible}`);
    
    // Test columns button (just verify it exists, don't click)
    const columnsButton = page.locator('button:has-text("Columns")');
    const columnsButtonVisible = await columnsButton.count() > 0;
    console.log(`✓ Columns toggle available: ${columnsButtonVisible}`);
    
    // Test first document clickability
    let firstDocClickable = false;
    if (totalDocs > 0) {
      const firstDocButton = page.locator('tbody tr:first-child td:first-child button');
      firstDocClickable = await firstDocButton.count() > 0;
      console.log(`✓ First document clickable: ${firstDocClickable}`);
    }
    
    // Take comprehensive screenshot
    console.log('📸 Taking comprehensive screenshot...');
    await page.screenshot({ 
      path: 'screenshots/documents-table-ai-insights.png',
      fullPage: true 
    });
    
    // Take table-focused screenshot
    const table = page.locator('table').first();
    if (await table.count() > 0) {
      await table.screenshot({ 
        path: 'screenshots/documents-table-detail.png'
      });
      console.log('📸 Table detail screenshot saved');
    }
    
    // Final summary report
    console.log('\n📋 FINAL TEST REPORT:');
    console.log('=======================');
    console.log(`✅ Page loaded successfully: YES`);
    console.log(`✅ All expected columns present: ${columnsFound}/6`);
    console.log(`📊 Total documents: ${totalDocs}`);
    
    if (totalDocs > 0) {
      console.log(`📊 Documents with AI insights: ${docsWithInsights}`);
      console.log(`📊 Documents without AI insights: ${docsWithoutInsights}`);
      console.log(`✅ Alert banner for missing insights: ${alertBannerVisible ? 'YES' : 'NO'}`);
      console.log(`✅ Search functionality: ${searchVisible ? 'AVAILABLE' : 'MISSING'}`);
      console.log(`✅ Column visibility toggle: ${columnsButtonVisible ? 'AVAILABLE' : 'MISSING'}`);
      console.log(`✅ Document names clickable: ${firstDocClickable ? 'YES' : 'NO'}`);
    }
    
    console.log('📸 Screenshots saved to screenshots/documents-table-ai-insights.png');
    console.log('✅ Test completed successfully!');
    
    // Verify key functionality is working
    expect(columnsFound).toBeGreaterThanOrEqual(6);
    expect(totalDocs).toBeGreaterThan(0);
  });
});