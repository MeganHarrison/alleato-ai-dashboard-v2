const { chromium } = require('playwright');

async function takeScreenshotsWithAuth() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/auth/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Take screenshot of login page first
    await page.screenshot({ 
      path: './screenshots/login-page.png', 
      fullPage: true 
    });
    console.log('✅ Login page screenshot saved');
    
    // Try to login with test credentials
    console.log('Attempting to login...');
    
    // Fill in login form
    await page.fill('input[name="email"], input[type="email"]', 'test@alleato.com');
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    
    // Click login button
    await page.click('button[type="submit"], button:has-text("Login")');
    
    // Wait for either redirect to meetings or stay on login (if credentials are wrong)
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('Current URL after login attempt:', currentUrl);
    
    if (currentUrl.includes('/auth/login')) {
      console.log('❌ Login failed or requires different credentials');
      console.log('Taking screenshot of login page with any error messages...');
      await page.screenshot({ 
        path: './screenshots/login-failed.png', 
        fullPage: true 
      });
      
      // Let's try to navigate directly to meetings and see what happens
      console.log('Trying to navigate directly to meetings...');
      await page.goto('http://localhost:3000/meetings');
      await page.waitForTimeout(2000);
      
      // Take screenshot of whatever page we land on
      await page.screenshot({ 
        path: './screenshots/direct-meetings-attempt.png', 
        fullPage: true 
      });
      
      return; // Exit if we can't authenticate
    }
    
    // If we got here, login was successful
    console.log('✅ Login successful! Navigating to meetings page...');
    
    // Navigate to meetings page
    await page.goto('http://localhost:3000/meetings', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for the page to load completely
    await page.waitForTimeout(8000);
    
    // Check if we can find the tab list
    const hasTablist = await page.locator('[role="tablist"]').count() > 0;
    if (!hasTablist) {
      console.log('No tablist found, waiting for data to load...');
      await page.waitForTimeout(5000);
    }
    
    // Take screenshot of initial meetings page
    console.log('Taking initial meetings page screenshot...');
    await page.screenshot({ 
      path: './screenshots/meetings-page-loaded.png', 
      fullPage: true 
    });
    
    // Define the tabs to screenshot
    const tabs = [
      'Meetings',
      'Clients', 
      'Contacts',
      'Companies',
      'Files',
      'Employees',
      'Subcontractors'
    ];
    
    // Try to click each tab and take screenshots
    for (const tabName of tabs) {
      try {
        console.log(`📸 Capturing ${tabName} tab...`);
        
        // Click the tab
        await page.click(`button:has-text("${tabName}")`);
        
        // Wait for content to load
        await page.waitForTimeout(3000);
        
        // Take screenshot
        await page.screenshot({ 
          path: `./screenshots/meetings-${tabName.toLowerCase()}-tab.png`, 
          fullPage: true 
        });
        
        console.log(`✅ ${tabName} tab screenshot saved`);
        
      } catch (error) {
        console.log(`❌ Could not capture ${tabName} tab: ${error.message}`);
        
        // Take a screenshot of current state for debugging
        await page.screenshot({ 
          path: `./screenshots/debug-${tabName.toLowerCase()}-tab.png`, 
          fullPage: true 
        });
      }
    }
    
    // Take final overview screenshot
    console.log('Taking final overview screenshot...');
    await page.screenshot({ 
      path: './screenshots/meetings-final-overview.png', 
      fullPage: true 
    });
    
    console.log('🎉 All screenshots completed!');
    
  } catch (error) {
    console.error('❌ Error in screenshot process:', error);
    
    // Take final debug screenshot
    try {
      await page.screenshot({ 
        path: './screenshots/final-error-debug.png', 
        fullPage: true 
      });
      console.log('Final debug screenshot saved');
    } catch (debugError) {
      console.error('Could not take final debug screenshot:', debugError);
    }
  } finally {
    await browser.close();
  }
}

takeScreenshotsWithAuth();