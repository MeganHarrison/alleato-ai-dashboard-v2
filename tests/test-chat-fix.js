// Quick test to verify the chat fix works
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to PM Assistant...');
    await page.goto('http://localhost:3005/pm-assistant');

    // Wait for the chat interface to be ready
    console.log('Waiting for chat interface...');
    await page.waitForSelector('textarea[placeholder*="Type a message"]', { timeout: 30000 });

    // Type a test message
    const testMessage = 'provide insights on the last meeting';
    console.log(`Typing test message: "${testMessage}"`);
    await page.type('textarea[placeholder*="Type a message"]', testMessage);

    // Submit the form
    console.log('Submitting message...');
    await page.keyboard.press('Enter');

    // Wait for response
    console.log('Waiting for AI response...');
    await page.waitForSelector('[data-message-role="assistant"]', { timeout: 30000 });

    console.log('✅ Test passed! Chat is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();