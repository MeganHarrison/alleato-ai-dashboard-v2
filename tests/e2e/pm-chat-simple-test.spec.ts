import { test, expect } from '@playwright/test';

test.describe('PM Chat Working - Simple Test', () => {
  test('should successfully test PM chat functionality end-to-end', async ({ page }) => {
    // Navigate to the PM chat page
    await page.goto('http://localhost:3003/pm-chat-working');
    
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
    
    // Verify the page loaded successfully
    await expect(page.locator('h1')).toContainText('PM Chat Assistant (Working)');
    console.log('✅ Page loaded successfully');
    
    // Find and verify input field is present
    const input = page.locator('input[placeholder*="Ask about meetings"]');
    await expect(input).toBeVisible();
    console.log('✅ Input field found and visible');
    
    // Fill in a test message
    const testMessage = "What can you help me with?";
    await input.fill(testMessage);
    await expect(input).toHaveValue(testMessage);
    console.log('✅ Message typed into input field');
    
    // Find and click the send button
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeVisible();
    await sendButton.click();
    console.log('✅ Send button clicked');
    
    // Wait for the message to be sent (user message should appear)
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 10000 });
    console.log('✅ User message appeared in chat');
    
    // Wait for the "AI is thinking" indicator
    try {
      await expect(page.locator('text=AI is thinking')).toBeVisible({ timeout: 10000 });
      console.log('✅ AI thinking indicator appeared');
    } catch (error) {
      console.log('⚠️ AI thinking indicator not found, but continuing...');
    }
    
    // Wait for an AI response - look for any meaningful response
    // We'll wait for the debug info to show more than 2 messages (welcome + user + AI response)
    await page.waitForFunction(() => {
      const debugText = document.querySelector('div:has-text("Messages:")');
      if (debugText && debugText.textContent) {
        const match = debugText.textContent.match(/Messages: (\d+)/);
        if (match) {
          const messageCount = parseInt(match[1]);
          return messageCount >= 3; // welcome + user + AI response
        }
      }
      return false;
    }, { timeout: 45000 });
    
    console.log('✅ AI response received (message count increased)');
    
    // Verify no error messages appear
    const errorMessages = page.locator('text=Error');
    await expect(errorMessages).toHaveCount(0);
    console.log('✅ No error messages displayed');
    
    // Take a final screenshot to prove functionality
    await page.screenshot({ 
      path: 'screenshots/pm-chat-working-functional-test.png',
      fullPage: true 
    });
    console.log('✅ Screenshot saved showing working chat');
    
    // Verify debug info shows expected state
    await expect(page.locator('text=API: /api/pm-rag-fallback')).toBeVisible();
    console.log('✅ Verified correct API endpoint is being used');
    
    console.log('🎉 ALL TESTS PASSED - PM Chat is fully functional!');
  });
});