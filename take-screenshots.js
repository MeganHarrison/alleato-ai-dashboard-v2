const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Taking screenshots of working chat interfaces...');
  
  // Screenshot 1: Business Expert Chat
  console.log('📸 /chat - Business Expert Chat');
  await page.goto('http://localhost:3001/chat');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshots/business-expert-chat-interface.png', fullPage: true });
  
  // Screenshot 2: Chat ASRS (Claude AI Chat)
  console.log('📸 /chat-asrs - Claude AI Chat');
  await page.goto('http://localhost:3001/chat-asrs');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshots/claude-ai-chat-interface.png', fullPage: true });
  
  // Screenshot 3: FM Global ASRS Expert Chat
  console.log('📸 /chat-asrs2 - FM Global ASRS Expert Chat');
  await page.goto('http://localhost:3001/chat-asrs2');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshots/fm-global-asrs-expert-chat.png', fullPage: true });
  
  // Screenshot 4: FM Global Form
  console.log('📸 /fm-global-form - FM Global Form Interface');
  await page.goto('http://localhost:3001/fm-global-form');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshots/fm-global-form-interface.png', fullPage: true });
  
  console.log('✅ All screenshots taken successfully!');
  
  await browser.close();
})();
