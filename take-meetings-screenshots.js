const { chromium } = require('playwright');

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to meetings page...');
    await page.goto('http://localhost:3000/meetings', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Wait for the page to load and tabs to appear
    console.log('Waiting for page to load...');
    await page.waitForTimeout(8000); // Give it time to load data
    
    // Wait for the loading to finish by looking for the main content
    await page.waitForSelector('[role="tablist"]', { timeout: 30000 });
    
    console.log('Page loaded successfully!');
    
    // Take screenshot of initial state (should show Meetings tab)
    console.log('Taking initial screenshot...');
    await page.screenshot({ 
      path: './screenshots/meetings-page-initial.png', 
      fullPage: true 
    });

    // Define the tabs with their exact values from the component
    const tabs = [
      { name: 'Meetings', value: 'meetings' },
      { name: 'Clients', value: 'clients' },
      { name: 'Contacts', value: 'contacts' },
      { name: 'Companies', value: 'companies' },
      { name: 'Files', value: 'files' },
      { name: 'Employees', value: 'employees' },
      { name: 'Subcontractors', value: 'subcontractors' }
    ];

    // Loop through each tab and take screenshots
    for (const tab of tabs) {
      console.log(`Clicking on ${tab.name} tab...`);
      
      try {
        // Click the tab by looking for the button with the specific text
        await page.locator(`button:has-text("${tab.name}")`).first().click();
        
        // Wait for content to load
        await page.waitForTimeout(3000);
        
        // Take screenshot
        console.log(`Taking screenshot of ${tab.name} tab...`);
        await page.screenshot({ 
          path: `./screenshots/meetings-${tab.name.toLowerCase()}-tab.png`, 
          fullPage: true 
        });
        
        console.log(`✅ Screenshot saved: meetings-${tab.name.toLowerCase()}-tab.png`);
      } catch (error) {
        console.log(`❌ Could not capture ${tab.name} tab: ${error.message}`);
        continue;
      }
    }

    // Take a final overview screenshot
    console.log('Taking final overview screenshot...');
    await page.screenshot({ 
      path: './screenshots/meetings-page-final.png', 
      fullPage: true 
    });

    console.log('🎉 All screenshots completed successfully!');

  } catch (error) {
    console.error('❌ Error taking screenshots:', error);
    
    // Take debug screenshot
    try {
      await page.screenshot({ 
        path: './screenshots/meetings-error-debug.png', 
        fullPage: true 
      });
      console.log('Debug screenshot saved as meetings-error-debug.png');
    } catch (debugError) {
      console.error('Could not take debug screenshot:', debugError);
    }
  } finally {
    await browser.close();
  }
}

takeScreenshots();