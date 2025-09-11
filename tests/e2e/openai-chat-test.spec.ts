import { test, expect } from '@playwright/test';

test.describe('OpenAI Chat Functionality', () => {
  test('should load page and send a message successfully', async ({ page }) => {
    // Navigate to the OpenAI chat page
    await page.goto('http://localhost:3003/openai');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify page loads correctly
    await expect(page.locator('h1')).toContainText('AI Chat Assistant');
    console.log('✅ Page loaded successfully');
    
    // Verify welcome message is visible
    await expect(page.getByText('Hello! I\'m your AI assistant')).toBeVisible();
    console.log('✅ Welcome message displayed');
    
    // Find input field and verify it's enabled
    const input = page.locator('input[placeholder*="Type your message"]');
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
    console.log('✅ Input field is ready');
    
    // Type a test message
    const testMessage = "Hello, this is a test message";
    await input.fill(testMessage);
    await expect(input).toHaveValue(testMessage);
    console.log('✅ Message typed successfully');
    
    // Find and click send button
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeEnabled();
    await sendButton.click();
    console.log('✅ Send button clicked');
    
    // Verify user message appears in chat
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 10000 });
    console.log('✅ User message displayed in chat');
    
    // Verify loading indicator appears
    await expect(page.getByText('AI is thinking')).toBeVisible({ timeout: 5000 });
    console.log('✅ Loading indicator shown');
    
    // Wait for AI response (give it time to call OpenAI API)
    await page.waitForFunction(() => {
      const messages = Array.from(document.querySelectorAll('[role]'));
      return messages.some(el => 
        el.textContent?.includes('AI') && 
        el.textContent?.length > 20 && 
        !el.textContent?.includes('AI is thinking')
      );
    }, { timeout: 30000 });
    console.log('✅ AI response received');
    
    // Verify no error messages
    await expect(page.getByText('Sorry, I encountered an error')).not.toBeVisible();
    console.log('✅ No error messages shown');
    
    // Take screenshot showing working chat
    await page.screenshot({ 
      path: 'screenshots/openai-chat-working.png',
      fullPage: true 
    });
    console.log('✅ Screenshot saved');
    
    console.log('🎉 ALL TESTS PASSED - OpenAI Chat is working!');
  });
  
  test('should handle empty input correctly', async ({ page }) => {
    await page.goto('http://localhost:3003/openai');
    await page.waitForLoadState('networkidle');
    
    // Verify send button is disabled when input is empty
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeDisabled();
    console.log('✅ Send button disabled for empty input');
    
    // Type whitespace only
    const input = page.locator('input[placeholder*="Type your message"]');
    await input.fill('   ');
    await expect(sendButton).toBeDisabled();
    console.log('✅ Send button disabled for whitespace-only input');
  });
});