const puppeteer = require('puppeteer');

async function testChat() {
  console.log('🚀 Starting final test...');
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: false
  });
  
  const page = await browser.newPage();
  
  // Log responses
  page.on('response', async res => {
    if (res.url().includes('/api/chat')) {
      console.log('📥 API Response:', res.status());
      const body = await res.text();
      console.log('📥 Response preview:', body.substring(0, 100) + '...');
    }
  });
  
  console.log('📍 Going to chat page...');
  await page.goto('http://localhost:3002/persistent-chat');
  await new Promise(r => setTimeout(r, 2000));
  
  // Take initial screenshot
  await page.screenshot({ path: 'final-1-initial.png', fullPage: true });
  console.log('📸 Saved: final-1-initial.png');
  
  // Type message
  console.log('⌨️  Typing message...');
  await page.type('textarea', 'Hello, can you help me with project management?');
  await page.screenshot({ path: 'final-2-typed.png', fullPage: true });
  console.log('📸 Saved: final-2-typed.png');
  
  // Submit
  console.log('🖱️  Clicking submit...');
  const submitButton = await page.$('button[type="submit"]');
  await submitButton.click();
  
  // Wait for response
  console.log('⏳ Waiting for response...');
  await new Promise(r => setTimeout(r, 5000));
  
  // Take final screenshot
  await page.screenshot({ path: 'final-3-response.png', fullPage: true });
  console.log('📸 Saved: final-3-response.png');
  
  // Check for messages
  const messageCount = await page.evaluate(() => {
    const userMessages = document.querySelectorAll('[role="user"]').length;
    const assistantMessages = document.querySelectorAll('[role="assistant"]').length;
    const anyMessages = document.querySelectorAll('.text-sm.prose').length;
    return { user: userMessages, assistant: assistantMessages, any: anyMessages };
  });
  
  console.log('📊 Message count:', messageCount);
  
  if (messageCount.user > 0 && messageCount.assistant > 0) {
    console.log('✅ SUCCESS! Chat is working!');
  } else {
    console.log('❌ No messages found in UI');
  }
  
  console.log('\n📁 Screenshots saved:');
  console.log('   - final-1-initial.png');
  console.log('   - final-2-typed.png');
  console.log('   - final-3-response.png');
  
  await browser.close();
}

testChat().catch(console.error);