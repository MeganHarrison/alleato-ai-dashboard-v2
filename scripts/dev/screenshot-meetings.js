const { chromium } = require('playwright');

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to meetings page
    console.log('Navigating to meetings page...');
    await page.goto('http://localhost:3001/meetings');
    
    // Wait for the page to load completely
    await page.waitForTimeout(3000);
    
    // Define the tabs to screenshot
    const tabs = [
      { name: 'Meetings', selector: 'button:has-text("Meetings")', filename: 'meetings-tab.png' },
      { name: 'Clients', selector: 'button:has-text("Clients")', filename: 'clients-tab.png' },
      { name: 'Contacts', selector: 'button:has-text("Contacts")', filename: 'contacts-tab.png' },
      { name: 'Companies', selector: 'button:has-text("Companies")', filename: 'companies-tab.png' },
      { name: 'Files', selector: 'button:has-text("Files")', filename: 'files-tab.png' },
      { name: 'Employees', selector: 'button:has-text("Employees")', filename: 'employees-tab.png' },
      { name: 'Subcontractors', selector: 'button:has-text("Subcontractors")', filename: 'subcontractors-tab.png' }
    ];

    // Take screenshot of initial state (should be Meetings tab)
    console.log('Taking screenshot of initial state...');
    await page.screenshot({ 
      path: './screenshots/meetings-page-initial.png', 
      fullPage: true 
    });

    // Loop through each tab
    for (const tab of tabs) {
      console.log(`Clicking on ${tab.name} tab...`);
      
      try {
        // Click the tab button
        await page.click(tab.selector);
        
        // Wait for content to load
        await page.waitForTimeout(2000);
        
        // Take screenshot
        console.log(`Taking screenshot of ${tab.name} tab...`);
        await page.screenshot({ 
          path: `./screenshots/${tab.filename}`, 
          fullPage: true 
        });
        
        console.log(`Screenshot saved: ${tab.filename}`);
      } catch (error) {
        console.log(`Could not find or click ${tab.name} tab: ${error.message}`);
        // Try alternative selectors or continue
        continue;
      }
      
      // Small delay between tabs
      await page.waitForTimeout(1000);
    }

    // Take a final screenshot showing all tabs
    console.log('Taking final overview screenshot...');
    await page.screenshot({ 
      path: './screenshots/meetings-page-all-tabs.png', 
      fullPage: true 
    });

    console.log('All screenshots completed successfully!');

  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();