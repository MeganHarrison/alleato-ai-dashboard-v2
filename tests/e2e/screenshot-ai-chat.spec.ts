import { test } from '@playwright/test';

test('Take screenshot of AI Chat ChatGPT-style interface', async ({ page }) => {
  await page.goto('http://localhost:3000/ai-chat');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Take full page screenshot
  await page.screenshot({ 
    path: 'screenshots/ai-chat-chatgpt-style-current.png',
    fullPage: true 
  });
  
  console.log('Screenshot saved: screenshots/ai-chat-chatgpt-style-current.png');
});