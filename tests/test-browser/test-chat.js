const puppeteer = require('puppeteer');

async function testChat() {
  console.log('🚀 Starting browser test...');
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser so we can see what's happening
    devtools: true   // Open devtools to see console logs
  });
  
  const page = await browser.newPage();
  
  // Set up console logging before navigation
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('error', err => console.log('Browser error:', err));
  page.on('pageerror', err => console.log('Page error:', err));
  page.on('requestfailed', req => console.log('Request failed:', req.url(), req.failure()));
  
  // Log all API requests
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      console.log('API Request:', req.method(), req.url());
    }
  });
  
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log('API Response:', res.status(), res.url());
    }
  });
  
  // Navigate to the chat page
  console.log('📍 Navigating to http://localhost:3002/persistent-chat');
  await page.goto('http://localhost:3002/persistent-chat', { waitUntil: 'networkidle0' });
  
  // Take screenshot of initial state
  await page.screenshot({ path: 'chat-initial.png', fullPage: true });
  console.log('📸 Screenshot saved: chat-initial.png');
  
  // Check if page loaded without errors
  const title = await page.title();
  console.log('📄 Page title:', title);
  
  // Look for the textarea
  const textarea = await page.$('textarea');
  if (!textarea) {
    console.error('❌ ERROR: No textarea found on page!');
    await browser.close();
    return;
  }
  console.log('✅ Found textarea input');
  
  // Type a test message
  console.log('⌨️  Typing test message...');
  await page.type('textarea', 'Hello, test message from Puppeteer');
  
  // Take screenshot after typing
  await page.screenshot({ path: 'chat-typed.png', fullPage: true });
  console.log('📸 Screenshot saved: chat-typed.png');
  
  // Find and click the submit button
  const submitButton = await page.$('button[type="submit"]');
  if (!submitButton) {
    console.error('❌ ERROR: No submit button found!');
    await browser.close();
    return;
  }
  console.log('✅ Found submit button');
  
  // Click submit
  console.log('🖱️  Clicking submit...');
  await submitButton.click();
  
  // Wait for either the user message or an error
  try {
    await page.waitForSelector('[role="user"]', { timeout: 5000 });
    console.log('✅ User message appeared in chat!');
    
    // Now wait for AI response
    await page.waitForSelector('[role="assistant"]', { timeout: 10000 });
    console.log('✅ AI response appeared!');
  } catch (error) {
    console.log('❌ Timeout waiting for messages:', error.message);
  }
  
  // Take screenshot after submit
  await page.screenshot({ path: 'chat-submitted.png', fullPage: true });
  console.log('📸 Screenshot saved: chat-submitted.png');
  
  // Also check for any messages in the conversation div
  const messagesCount = await page.evaluate(() => {
    const messages = document.querySelectorAll('[role="user"], [role="assistant"]');
    console.log('Found messages:', messages.length);
    return messages.length;
  });
  console.log(`📊 Total messages found: ${messagesCount}`);
  
  // Check for AI response
  const aiResponse = await page.evaluate(() => {
    const messages = document.querySelectorAll('[role="assistant"]');
    return messages.length > 0;
  });
  
  if (aiResponse) {
    console.log('✅ AI response received!');
  } else {
    console.log('❌ No AI response found');
  }
  
  console.log('\n🎯 Test complete! Check the screenshots:');
  console.log('  - chat-initial.png');
  console.log('  - chat-typed.png'); 
  console.log('  - chat-submitted.png');
  
  // Keep browser open for manual inspection
  console.log('\n👀 Browser will stay open for manual inspection. Press Ctrl+C to close.');
}

testChat().catch(console.error);