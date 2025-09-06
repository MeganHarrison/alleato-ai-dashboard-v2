const puppeteer = require('puppeteer');

async function testAuth() {
  console.log('🔐 Testing authentication flow...');
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: false
  });
  
  const page = await browser.newPage();
  
  // Test 1: Try to access protected route without auth
  console.log('\n📍 Test 1: Accessing protected route without authentication');
  await page.goto('http://localhost:3002/dashboard');
  await new Promise(r => setTimeout(r, 2000));
  
  const currentUrl1 = page.url();
  console.log('Current URL:', currentUrl1);
  
  if (currentUrl1.includes('/login')) {
    console.log('✅ Successfully redirected to login page');
    
    // Check if redirectedFrom parameter is set
    const url = new URL(currentUrl1);
    const redirectedFrom = url.searchParams.get('redirectedFrom');
    if (redirectedFrom === '/dashboard') {
      console.log('✅ Redirect parameter correctly set:', redirectedFrom);
    } else {
      console.log('❌ Redirect parameter not set correctly');
    }
  } else {
    console.log('❌ Failed to redirect to login page');
  }
  
  // Test 2: Try another protected route
  console.log('\n📍 Test 2: Accessing /persistent-chat without authentication');
  await page.goto('http://localhost:3002/persistent-chat');
  await new Promise(r => setTimeout(r, 2000));
  
  const currentUrl2 = page.url();
  console.log('Current URL:', currentUrl2);
  
  if (currentUrl2.includes('/login')) {
    console.log('✅ Successfully redirected to login page');
  } else {
    console.log('❌ Failed to redirect to login page');
  }
  
  // Test 3: Access auth route directly
  console.log('\n📍 Test 3: Accessing /login directly');
  await page.goto('http://localhost:3002/login');
  await new Promise(r => setTimeout(r, 2000));
  
  const currentUrl3 = page.url();
  console.log('Current URL:', currentUrl3);
  
  if (currentUrl3.includes('/login') && !currentUrl3.includes('redirectedFrom')) {
    console.log('✅ Login page accessible without authentication');
  } else {
    console.log('❌ Unexpected behavior on login page');
  }
  
  // Take screenshot of login page
  await page.screenshot({ path: 'auth-test-login-page.png', fullPage: true });
  console.log('\n📸 Screenshot saved: auth-test-login-page.png');
  
  console.log('\n🎯 Authentication test complete!');
  await browser.close();
}

testAuth().catch(console.error);