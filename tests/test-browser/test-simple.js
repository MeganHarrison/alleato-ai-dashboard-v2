const puppeteer = require('puppeteer');

async function testChat() {
  console.log('🚀 Starting simple browser test...');
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Log everything
  page.on('console', msg => console.log('Browser:', msg.text()));
  page.on('request', req => {
    if (req.url().includes('/api/chat')) {
      console.log('📤 API Request:', req.method(), req.url());
      console.log('📤 Request body:', req.postData());
    }
  });
  page.on('response', res => {
    if (res.url().includes('/api/chat')) {
      console.log('📥 API Response:', res.status(), res.url());
      res.text().then(body => console.log('📥 Response body:', body));
    }
  });
  
  console.log('📍 Going to chat page...');
  await page.goto('http://localhost:3002/persistent-chat');
  await new Promise(r => setTimeout(r, 2000));
  
  // Type and submit
  console.log('⌨️  Typing message...');
  await page.type('textarea', 'Test message');
  
  console.log('🖱️  Clicking submit...');
  const submitButton = await page.$('button[type="submit"]');
  await submitButton.click();
  
  // Wait a bit to see what happens
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('✅ Test done! Check the browser.');
}

testChat().catch(console.error);