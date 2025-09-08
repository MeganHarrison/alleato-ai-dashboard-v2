const { chromium } = require('playwright');
const fs = require('fs').promises;

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to homepage...');
    await page.goto('http://localhost:3001/');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if we need to login or if we're already authenticated
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/auth/login')) {
      console.log('Need to login first. Opening login page...');
      // If we need to implement login, we'd do it here
      // For now, let's see if we can access meetings directly
    }
    
    // Try to navigate directly to meetings page
    console.log('Navigating to meetings page...');
    await page.goto('http://localhost:3001/meetings', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Wait for the page content to load
    await page.waitForTimeout(5000);
    
    // Check if we got redirected to login
    const finalUrl = page.url();
    if (finalUrl.includes('/auth/login')) {
      console.log('Still redirected to login. Taking screenshot of login page...');
      await page.screenshot({ 
        path: './screenshots/login-page.png', 
        fullPage: true 
      });
      console.log('Login page screenshot saved. Authentication may be required.');
      return;
    }
    
    // Wait for the tabs to be present
    console.log('Waiting for tabs to load...');
    await page.waitForSelector('[role="tablist"]', { timeout: 30000 });
    
    // Take screenshot of initial state (should be Meetings tab)
    console.log('Taking screenshot of initial state...');
    await page.screenshot({ 
      path: './screenshots/meetings-page-initial.png', 
      fullPage: true 
    });

    // Define the tabs to screenshot with their exact values from the component
    const tabs = [
      { name: 'Meetings', value: 'meetings', filename: 'meetings-tab.png' },
      { name: 'Clients', value: 'clients', filename: 'clients-tab.png' },
      { name: 'Contacts', value: 'contacts', filename: 'contacts-tab.png' },
      { name: 'Companies', value: 'companies', filename: 'companies-tab.png' },
      { name: 'Files', value: 'files', filename: 'files-tab.png' },
      { name: 'Employees', value: 'employees', filename: 'employees-tab.png' },
      { name: 'Subcontractors', value: 'subcontractors', filename: 'subcontractors-tab.png' }
    ];

    // Loop through each tab
    for (const tab of tabs) {
      console.log(`Clicking on ${tab.name} tab...`);
      
      try {
        // Click the tab using the data-value attribute
        const tabSelector = `[role="tab"][data-state="inactive"][value="${tab.value}"], [role="tab"][data-state="active"][value="${tab.value}"]`;
        const alternativeSelector = `button:has-text("${tab.name}")`;
        
        // Try primary selector first
        try {
          await page.click(tabSelector, { timeout: 5000 });
        } catch (error) {
          // Try alternative selector
          console.log(`Primary selector failed for ${tab.name}, trying alternative...`);
          await page.click(alternativeSelector, { timeout: 5000 });
        }
        
        // Wait for content to load and any animations to complete
        await page.waitForTimeout(3000);
        
        // Wait for the tab content to be visible
        await page.waitForSelector(`[data-state="active"][value="${tab.value}"]`, { timeout: 10000 });
        
        // Take screenshot
        console.log(`Taking screenshot of ${tab.name} tab...`);
        await page.screenshot({ 
          path: `./screenshots/${tab.filename}`, 
          fullPage: true 
        });
        
        console.log(`Screenshot saved: ${tab.filename}`);
      } catch (error) {
        console.log(`Could not find or click ${tab.name} tab: ${error.message}`);
        // Continue to next tab
        continue;
      }
      
      // Small delay between tabs
      await page.waitForTimeout(1000);
    }

    // Take a final screenshot showing all tabs overview
    console.log('Taking final overview screenshot...');
    await page.screenshot({ 
      path: './screenshots/meetings-page-all-tabs-final.png', 
      fullPage: true 
    });

    // Get page title and content info
    const pageTitle = await page.title();
    const tabsCount = await page.locator('[role="tab"]').count();
    
    console.log(`Page title: ${pageTitle}`);
    console.log(`Number of tabs found: ${tabsCount}`);
    console.log('All screenshots completed successfully!');

    // Write a summary file
    const summary = {
      timestamp: new Date().toISOString(),
      pageTitle,
      tabsCount,
      tabsScreenshot: tabs.map(t => ({ name: t.name, filename: t.filename })),
      url: finalUrl
    };
    
    await fs.writeFile('./screenshots/screenshot-summary.json', JSON.stringify(summary, null, 2));

  } catch (error) {
    console.error('Error taking screenshots:', error);
    
    // Take a screenshot of the current state for debugging
    try {
      await page.screenshot({ 
        path: './screenshots/error-debug.png', 
        fullPage: true 
      });
      console.log('Debug screenshot saved as error-debug.png');
    } catch (debugError) {
      console.error('Could not take debug screenshot:', debugError);
    }
  } finally {
    await browser.close();
  }
}

takeScreenshots();