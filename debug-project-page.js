// Simple debug script to test project page manually
const puppeteer = require('puppeteer');

async function debugProjectPage() {
  console.log('🔍 Starting project page debug...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen to console messages from the page
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });
  
  // Listen to page errors
  page.on('pageerror', error => {
    console.error('PAGE ERROR:', error.message);
  });
  
  // Listen to network responses
  page.on('response', response => {
    if (response.status() >= 400) {
      console.error('NETWORK ERROR:', response.status(), response.url());
    }
  });
  
  try {
    console.log('📍 Navigating to project page...');
    await page.goto('http://localhost:4000/projects/1', { waitUntil: 'networkidle2' });
    
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'screenshots/debug-project-page.png', fullPage: true });
    
    // Check for error details
    const errorElement = await page.$('text=Error Details');
    if (errorElement) {
      console.log('🔍 Found error details, clicking...');
      await errorElement.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/debug-error-details.png', fullPage: true });
    }
    
    console.log('✅ Debug completed');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

// Check if puppeteer is available, if not use a simpler approach
try {
  debugProjectPage();
} catch (error) {
  console.log('Puppeteer not available, using curl instead...');
  
  // Use curl to check the page
  const { exec } = require('child_process');
  exec('curl -s http://localhost:4000/projects/1', (error, stdout, stderr) => {
    if (error) {
      console.error('Curl error:', error);
      return;
    }
    console.log('Page HTML preview:', stdout.substring(0, 1000) + '...');
  });
}