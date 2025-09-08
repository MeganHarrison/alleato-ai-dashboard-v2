const { chromium } = require('playwright');

async function testProjectDetailDesign() {
  let browser;
  
  try {
    // Start the server and wait for it to be ready
    console.log('🚀 Starting development server...');
    const { spawn } = require('child_process');
    
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    });
    
    // Wait for server to start
    await new Promise((resolve) => {
      server.stdout.on('data', (data) => {
        if (data.toString().includes('Ready') || data.toString().includes('started')) {
          console.log('✅ Server is ready');
          resolve();
        }
      });
      
      // Fallback timeout
      setTimeout(resolve, 15000);
    });
    
    // Give the server a bit more time to stabilize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 500 // Slow down for better visual testing
    });
    
    const context = await browser.newContext({
      viewport: { width: 1400, height: 1000 },
      ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    console.log('🔍 Testing project detail page...');
    
    try {
      // Try to navigate to the project detail page with timeout
      await page.goto('http://localhost:3000/projects/1', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Wait a bit for dynamic content to load
      await page.waitForTimeout(5000);
      
      // Take a full page screenshot showing the new design
      await page.screenshot({
        path: 'screenshots/improved-project-detail-design.png',
        fullPage: true,
        quality: 90
      });
      
      console.log('✅ Screenshot captured successfully!');
      console.log('📱 Captured: Project detail page design');
      
      // Test for key design elements
      try {
        // Check for header section
        const header = await page.locator('h1, h2').first().isVisible();
        console.log(`📋 Header visible: ${header}`);
        
        // Check for any card components
        const cards = await page.locator('[class*="card"], .card, [class*="bg-white"]').count();
        console.log(`🃏 Found ${cards} card-like elements`);
        
        // Check for navigation or sidebar
        const nav = await page.locator('nav, [role="navigation"], aside').count();
        console.log(`🧭 Found ${nav} navigation elements`);
        
      } catch (error) {
        console.log('⚠️ Some element checks failed, but main screenshot captured');
      }
      
    } catch (navError) {
      console.log('⚠️ Direct navigation failed, trying dashboard first...');
      
      try {
        // Try going to dashboard first
        await page.goto('http://localhost:3000', { 
          waitUntil: 'domcontentloaded',
          timeout: 15000 
        });
        await page.waitForTimeout(3000);
        
        // Take a screenshot of whatever loads
        await page.screenshot({
          path: 'screenshots/improved-project-detail-design.png',
          fullPage: true,
          quality: 90
        });
        
        console.log('✅ Screenshot captured from homepage/dashboard');
        
      } catch (fallbackError) {
        console.error('❌ All navigation attempts failed:', fallbackError.message);
      }
    }
    
    // Stop the server
    server.kill();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testProjectDetailDesign().catch(console.error);