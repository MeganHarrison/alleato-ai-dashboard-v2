const puppeteer = require('puppeteer');

async function testDashboard() {
  console.log('🚀 Testing dashboard with projects table...');
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: false
  });
  
  const page = await browser.newPage();
  
  // Set up console logging
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('pageerror', err => console.log('Page error:', err));
  
  console.log('📍 Navigating to dashboard...');
  await page.goto('http://localhost:3002/dashboard');
  await new Promise(r => setTimeout(r, 3000));
  
  // Take screenshot
  await page.screenshot({ path: 'dashboard-projects.png', fullPage: true });
  console.log('📸 Screenshot saved: dashboard-projects.png');
  
  // Check if projects table is visible
  const tableExists = await page.evaluate(() => {
    const table = document.querySelector('table');
    return !!table;
  });
  
  if (tableExists) {
    console.log('✅ Projects table found');
    
    // Count rows
    const rowCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return rows.length;
    });
    console.log(`📊 Found ${rowCount} project rows`);
    
    // Try clicking on first project name
    const firstProjectButton = await page.$('tbody tr:first-child button[variant="link"]');
    if (firstProjectButton) {
      console.log('🖱️ Clicking on first project...');
      await firstProjectButton.click();
      await new Promise(r => setTimeout(r, 2000));
      
      // Check if sheet opened
      const sheetVisible = await page.evaluate(() => {
        const sheet = document.querySelector('[role="dialog"]');
        return !!sheet;
      });
      
      if (sheetVisible) {
        console.log('✅ Project details sheet opened!');
        await page.screenshot({ path: 'dashboard-project-details.png', fullPage: true });
        console.log('📸 Screenshot saved: dashboard-project-details.png');
      } else {
        console.log('❌ Project details sheet not found');
      }
    }
  } else {
    console.log('❌ Projects table not found');
  }
  
  console.log('\n🎯 Dashboard test complete!');
  await browser.close();
}

testDashboard().catch(console.error);