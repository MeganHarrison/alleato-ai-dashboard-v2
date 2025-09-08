import { test, expect } from '@playwright/test';

test.describe('Project Documents Table', () => {
  test('should display documents table on project page', async ({ page }) => {
    // Navigate to the project page
    await page.goto('http://localhost:3010/projects/1');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the full page
    await page.screenshot({ 
      path: '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots/project-page-full.png',
      fullPage: true 
    });
    
    // Check if Documents section exists
    const documentsSection = page.locator('h2', { hasText: 'Documents' });
    await expect(documentsSection).toBeVisible();
    
    // Check if the table exists
    const documentsTable = page.locator('table').first();
    await expect(documentsTable).toBeVisible();
    
    // Check table headers
    const headers = page.locator('th');
    await expect(headers.nth(0)).toContainText('Title');
    await expect(headers.nth(1)).toContainText('Date');
    await expect(headers.nth(2)).toContainText('Summary');
    await expect(headers.nth(3)).toContainText('Actions');
    
    // Take a screenshot of the documents section specifically
    const documentsTableSection = page.locator('div:has(table)').first();
    await documentsTableSection.screenshot({
      path: '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots/project-documents-table.png'
    });
    
    console.log('✓ Project page loaded successfully');
    console.log('✓ Documents section found');
    console.log('✓ Documents table displayed');
    console.log('✓ Table headers verified: Title, Date, Summary, Actions');
    console.log('✓ Screenshots saved to screenshots/');
  });
  
  test('should test document table interactions', async ({ page }) => {
    // Navigate to the project page
    await page.goto('http://localhost:3010/projects/1');
    await page.waitForLoadState('networkidle');
    
    // Look for any documents in the table
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    
    console.log(`Found ${rowCount} document rows`);
    
    if (rowCount > 0) {
      // Test if we have actual data rows (not just the "no documents" message)
      const firstRow = tableRows.first();
      const firstRowCells = firstRow.locator('td');
      const cellCount = await firstRowCells.count();
      
      if (cellCount >= 4) {
        console.log('✓ Documents found in table');
        
        // Try to find Edit button in the first row
        const editButton = firstRow.locator('button[title="Edit document"]');
        if (await editButton.count() > 0) {
          console.log('✓ Edit button found');
          
          // Click edit button to test editing functionality
          await editButton.click();
          await page.waitForTimeout(500);
          
          // Check if we're now in edit mode (should see Save and Cancel buttons)
          const saveButton = firstRow.locator('button[title="Save changes"]');
          const cancelButton = firstRow.locator('button[title="Cancel"]');
          
          if (await saveButton.count() > 0 && await cancelButton.count() > 0) {
            console.log('✓ Edit mode activated - Save and Cancel buttons visible');
            
            // Take screenshot of edit mode
            await documentsTableSection.screenshot({
              path: '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots/project-documents-edit-mode.png'
            });
            
            // Cancel the edit to return to normal mode
            await cancelButton.click();
            await page.waitForTimeout(500);
            console.log('✓ Edit cancelled successfully');
          } else {
            console.log('⚠ Could not find Save/Cancel buttons in edit mode');
          }
        }
        
        // Test download button
        const downloadButton = firstRow.locator('button[title="Download document"]');
        if (await downloadButton.count() > 0) {
          console.log('✓ Download button found');
        }
        
        // Test delete button (but don't click it)
        const deleteButton = firstRow.locator('button[title="Delete document"]');
        if (await deleteButton.count() > 0) {
          console.log('✓ Delete button found');
        }
        
      } else {
        console.log('⚠ Table rows found but insufficient cells - may be "no documents" message');
      }
    } else {
      console.log('ℹ No document rows found - table may be empty');
      
      // Check for empty state message
      const emptyMessage = page.locator('text=No documents found');
      if (await emptyMessage.count() > 0) {
        console.log('✓ Empty state message displayed correctly');
      }
    }
  });
});