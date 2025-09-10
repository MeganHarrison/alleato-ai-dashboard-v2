import { test, expect } from '@playwright/test';

test.describe('PM Chat Working Page Verification', () => {
  test('should load PM chat page and test full chat functionality', async ({ page }) => {
    // Navigate to the PM chat page
    await page.goto('http://localhost:3003/pm-chat-working');

    // Wait for the page to load and verify the title
    await expect(page.locator('h1')).toContainText('PM Chat Assistant (Working)');
    
    // Verify the example query buttons are visible (these show the page loaded correctly)
    await expect(page.locator('button', { hasText: 'What were the key decisions' })).toBeVisible();
    
    // Scroll down to see the chat area - look for the initial welcome message in the chat
    await page.locator('text=Hello! I\'m your PM Assistant').scrollIntoViewIfNeeded();
    await expect(page.locator('text=Hello! I\'m your PM Assistant')).toBeVisible();
    
    // Test the input field is present and enabled
    const input = page.locator('input[placeholder*="Ask about meetings"]');
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
    
    // Send a test message
    const testMessage = "What can you help me with?";
    await input.fill(testMessage);
    
    // Click the send button
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeVisible();
    await sendButton.click();
    
    // Wait for the user message to appear in the chat
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 10000 });
    
    // Wait for loading indicator to appear (showing AI is processing)
    await expect(page.locator('text=AI is thinking')).toBeVisible({ timeout: 5000 });
    
    // Wait for the AI response to appear (timeout of 30 seconds for AI response)
    // Look for common PM Assistant response patterns
    await page.waitForFunction(() => {
      const messages = document.querySelectorAll('div');
      for (const message of messages) {
        const text = message.textContent || '';
        if (text.includes('PM Assistant') && text.length > 50 && !text.includes('Hello! I\'m your PM Assistant')) {
          return true;
        }
      }
      return false;
    }, { timeout: 30000 });
    
    // Verify no error messages are shown
    await expect(page.locator('text=Error').first()).not.toBeVisible();
    
    // Verify the debug info shows correct state
    await expect(page.locator('text=Messages:')).toBeVisible();
    await expect(page.locator('text=API: /api/pm-rag-fallback')).toBeVisible();
    
    // Take a screenshot showing the working chat
    await page.screenshot({ 
      path: 'screenshots/pm-chat-working-verified.png',
      fullPage: true 
    });
    
    console.log('✅ PM Chat functionality verified successfully!');
    console.log('✅ User message sent and displayed');
    console.log('✅ AI response received and displayed');
    console.log('✅ Screenshot saved showing working chat');
  });

  test('should test example query button functionality', async ({ page }) => {
    // Navigate to the PM chat page
    await page.goto('http://localhost:3003/pm-chat-working');
    
    // Click on one of the example query buttons
    const exampleButton = page.locator('button', { hasText: 'What were the key decisions' }).first();
    await expect(exampleButton).toBeVisible();
    await exampleButton.click();
    
    // Wait a moment for the input to be populated
    await page.waitForTimeout(500);
    
    // Verify the input field is populated with the example query
    const input = page.locator('input[placeholder*="Ask about meetings"]');
    await expect(input).toHaveValue('What were the key decisions from our last project meeting?');
    
    // Submit the query
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();
    
    // Wait for AI response
    await expect(page.locator('text=AI is thinking')).toBeVisible({ timeout: 5000 });
    
    // Wait for response using the same method as the first test
    await page.waitForFunction(() => {
      const messages = document.querySelectorAll('div');
      for (const message of messages) {
        const text = message.textContent || '';
        if (text.includes('PM Assistant') && text.length > 50 && !text.includes('Hello! I\'m your PM Assistant')) {
          return true;
        }
      }
      return false;
    }, { timeout: 30000 });
    
    console.log('✅ Example query button functionality verified!');
  });
});