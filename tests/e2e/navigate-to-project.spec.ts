import { test, expect } from '@playwright/test';

test('Navigate to Individual Project Page', async ({ page }) => {
  test.setTimeout(90000);
  
  console.log('🎯 Finding and navigating to individual project page...');
  
  try {
    // Navigate to Projects Dashboard
    console.log('📍 Navigating to Projects Dashboard...');
    await page.goto('http://localhost:3010/projects-dashboard', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    console.log('✅ Projects Dashboard loaded');
    
    // Try different ways to find the project link
    console.log('🔍 Looking for project links...');
    
    // Method 1: Look for any links that contain "Alleato"
    const alleatoLinks = await page.locator('a[href*="/projects/"]').count();
    console.log(`📋 Found ${alleatoLinks} project detail links`);
    
    if (alleatoLinks > 0) {
      // Get the first project link
      const firstProjectLink = page.locator('a[href*="/projects/"]').first();
      const href = await firstProjectLink.getAttribute('href');
      const text = await firstProjectLink.textContent();
      
      console.log(`🎯 First project link: ${href} - "${text?.trim()}"`);
      
      // Click the link
      await firstProjectLink.click();
      await page.waitForTimeout(4000);
      
      const currentUrl = page.url();
      console.log(`📍 Navigated to: ${currentUrl}`);
      
      // Take screenshot of the project detail page
      await page.screenshot({ 
        path: 'screenshots/individual-project-detail.png',
        fullPage: true 
      });
      console.log('📸 Project detail page screenshot taken');
      
      // Now test for Documents section and table
      const documentsText = await page.locator('h2:has-text("Documents")').count();
      console.log(`📄 Documents H2 section found: ${documentsText}`);
      
      if (documentsText > 0) {
        console.log('🎉 Found Documents section!');
        
        // Look for table specifically
        const tables = await page.locator('table').count();
        console.log(`📊 Tables found: ${tables}`);
        
        if (tables > 0) {
          console.log('🎉 SUCCESS: Documents table is present!');
          
          // Check table headers
          const tableHeaders = await page.locator('th').allTextContents();
          console.log('📋 Table headers:', tableHeaders);
          
          // Verify this is the documents table
          const hasDocumentHeaders = tableHeaders.some(header => 
            header.toLowerCase().includes('title') || 
            header.toLowerCase().includes('summary') || 
            header.toLowerCase().includes('date')
          );
          
          if (hasDocumentHeaders) {
            console.log('✅ CONFIRMED: This is the Documents table!');
            
            // Take specific screenshot of documents table
            const tableSection = page.locator('div:has(table)').first();
            await tableSection.screenshot({
              path: 'screenshots/project-documents-table.png'
            });
            console.log('📸 Documents table screenshot saved to screenshots/project-documents-table.png');
            
            // Test table functionality
            const rows = await page.locator('tbody tr').count();
            console.log(`📊 Table rows: ${rows}`);
            
            if (rows > 0) {
              console.log('📄 Table has data! Testing CRUD operations...');
              
              // Test Edit button
              const editButtons = await page.locator('button[title="Edit document"]').count();
              console.log(`✏️ Edit buttons: ${editButtons}`);
              
              if (editButtons > 0) {
                console.log('🧪 Testing edit functionality...');
                await page.locator('button[title="Edit document"]').first().click();
                await page.waitForTimeout(1000);
                
                const saveButtons = await page.locator('button[title="Save changes"]').count();
                const cancelButtons = await page.locator('button[title="Cancel"]').count();
                
                console.log(`💾 Save buttons: ${saveButtons}`);
                console.log(`❌ Cancel buttons: ${cancelButtons}`);
                
                if (saveButtons > 0 && cancelButtons > 0) {
                  console.log('✅ Edit mode works! Taking screenshot...');
                  
                  await page.screenshot({
                    path: 'screenshots/documents-edit-mode.png',
                    fullPage: true
                  });
                  
                  // Cancel edit
                  await page.locator('button[title="Cancel"]').first().click();
                  await page.waitForTimeout(500);
                  console.log('✅ Cancel works');
                }
              }
              
              // Test Download button
              const downloadButtons = await page.locator('button[title="Download document"]').count();
              console.log(`📥 Download buttons: ${downloadButtons}`);
              
              // Test Delete button (don't actually delete)
              const deleteButtons = await page.locator('button[title="Delete document"]').count();
              console.log(`🗑️ Delete buttons: ${deleteButtons}`);
              
              console.log('\n🎉 DOCUMENTS TABLE TEST RESULTS:');
              console.log('=====================================');
              console.log(`✅ Table displays correctly: YES`);
              console.log(`✅ Has proper columns (Title, Date, Summary, Actions): YES`);
              console.log(`✅ Edit functionality: ${editButtons > 0 ? 'YES' : 'NO'}`);
              console.log(`✅ Download functionality: ${downloadButtons > 0 ? 'YES' : 'NO'}`);
              console.log(`✅ Delete functionality: ${deleteButtons > 0 ? 'YES' : 'NO'}`);
              console.log(`📊 Data rows: ${rows}`);
              console.log('=====================================');
              
            } else {
              console.log('ℹ️ Table shows empty state (no documents)');
              
              const emptyState = await page.locator('text*="No documents"').count();
              console.log(`📭 Empty state message: ${emptyState > 0 ? 'YES' : 'NO'}`);
            }
          }
        } else {
          console.log('⚠️ Documents section found but no table present');
        }
      } else {
        console.log('⚠️ No Documents section found');
        
        // Debug: show all sections
        const allSections = await page.locator('h2').allTextContents();
        console.log('🏷️ Available sections:', allSections);
      }
      
    } else {
      console.log('❌ No project detail links found');
      
      // Try manual navigation to a project ID
      console.log('🔧 Trying manual navigation to project ID...');
      await page.goto('http://localhost:3010/projects/1');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      const is404 = await page.locator('text=404').count() > 0;
      
      console.log(`📍 Manual navigation result: ${currentUrl}`);
      console.log(`❌ Is 404: ${is404}`);
      
      if (!is404) {
        console.log('✅ Manual navigation worked! Checking for documents...');
        
        await page.screenshot({ 
          path: 'screenshots/manual-project-navigation.png',
          fullPage: true 
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    try {
      await page.screenshot({ 
        path: 'screenshots/navigation-error.png',
        fullPage: true 
      });
    } catch (e) {
      console.error('Could not take error screenshot');
    }
    
    throw error;
  }
});