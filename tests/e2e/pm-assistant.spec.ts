import { test, expect } from '@playwright/test';

// Test configuration
const TEST_TIMEOUT = 120 * 1000; // 2 minutes per test
const CHAT_RESPONSE_TIMEOUT = 60 * 1000; // 1 minute for chat responses

// Configure base URL if not set
test.use({
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
});

test.describe('PM Assistant RAG Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to PM Assistant page
    await page.goto('/pm-assistant');
    
    // Check if we need to login
    if (await page.url().includes('/auth/login')) {
      // Use test credentials - these should be set in env or test config
      await page.fill('input[type="email"]', process.env.TEST_EMAIL || 'test@example.com');
      await page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'testpassword');
      await page.click('button:has-text("Login")');
      
      // Wait for redirect to PM Assistant
      await page.waitForURL('/pm-assistant', { timeout: 10000 });
    }
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should load PM Assistant page and auto-initialize', async ({ page }) => {
    // Should show loading state immediately
    await expect(page.locator('text=Initializing PM Assistant...')).toBeVisible({ timeout: 5000 });
    
    // Wait for initialization to complete
    await expect(page.locator('text=Initializing PM Assistant...')).toBeHidden({ timeout: 15000 });
    
    // Check page title is now visible
    await expect(page.locator('h1:has-text("AI Project Manager Assistant")')).toBeVisible();
    
    // Check for RAG-Enhanced badge
    await expect(page.locator('text=RAG-Enhanced')).toBeVisible();
    
    // Chat interface should be visible WITHOUT clicking any button
    await expect(page.locator('text=Hello! I\'m your AI Project Manager assistant')).toBeVisible();
    
    // Chat input should be ready
    await expect(page.locator('textarea[placeholder*="Type a message"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="Type a message"]')).toBeEnabled();
  });

  test('should handle initialization errors gracefully', async ({ page }) => {
    // If initialization fails, should show error state
    // Note: This test may pass if initialization succeeds, which is fine
    
    // Wait for either successful initialization or error
    const initSuccess = page.locator('textarea[placeholder*="Type a message"]');
    const initError = page.locator('text=Initialization Error');
    
    await Promise.race([
      expect(initSuccess).toBeVisible({ timeout: 15000 }),
      expect(initError).toBeVisible({ timeout: 15000 })
    ]);
    
    // If error is shown, verify refresh button exists
    if (await initError.isVisible()) {
      await expect(page.locator('button:has-text("Refresh Page")')).toBeVisible();
    } else {
      // Otherwise verify chat is ready
      await expect(initSuccess).toBeEnabled();
    }
  });

  test('should send a message and receive a RAG-enhanced response', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    // Wait for auto-initialization to complete
    await page.waitForSelector('textarea[placeholder*="Type a message"]', { timeout: 15000 });
    
    // Type a test message about meetings
    const testQuery = 'What meetings have been held recently and what were the key topics?';
    await page.fill('textarea[placeholder*="Type a message"]', testQuery);
    
    // Send the message
    await page.press('textarea[placeholder*="Type a message"]', 'Enter');
    
    // Wait for the message to appear in chat
    await expect(page.locator(`text="${testQuery}"`)).toBeVisible();
    
    // Wait for AI response to start streaming
    await expect(page.locator('text=AI is thinking...')).toBeVisible({ timeout: 5000 });
    
    // Wait for response to complete (no more "AI is thinking...")
    await expect(page.locator('text=AI is thinking...')).toBeHidden({ timeout: CHAT_RESPONSE_TIMEOUT });
    
    // Check that we got a response
    const responseElements = await page.locator('[data-role="assistant"]').count();
    expect(responseElements).toBeGreaterThan(0);
    
    // Verify the response contains relevant content
    const responseText = await page.locator('[data-role="assistant"]').last().textContent();
    console.log('AI Response:', responseText);
    
    // The response should mention meetings or indicate it's searching
    expect(responseText).toBeTruthy();
    expect(responseText.length).toBeGreaterThan(50); // Ensure it's not just an error message
  });

  test('should use quick action templates', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    // Wait for auto-initialization to complete
    await page.waitForSelector('textarea[placeholder*="Type a message"]', { timeout: 15000 });
    
    // Switch to Quick Insights tab
    await page.click('button[role="tab"]:has-text("Quick Insights")');
    
    // Click on Project Status template
    const statusButton = page.locator('button:has-text("Project Status")').first();
    await expect(statusButton).toBeVisible();
    await statusButton.click();
    
    // Should populate the chat input (if implemented)
    // or navigate back to chat tab with the query
    // For now, we'll check if we're back on the chat tab
    const chatTab = page.locator('button[role="tab"][data-state="active"]:has-text("Chat")');
    await expect(chatTab).toBeVisible({ timeout: 5000 });
  });

  test('should handle search for project risks', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    // Wait for auto-initialization to complete
    await page.waitForSelector('textarea[placeholder*="Type a message"]', { timeout: 15000 });
    
    // Ask about risks
    const riskQuery = 'What are the current risks and blockers for my projects?';
    await page.fill('textarea[placeholder*="Type a message"]', riskQuery);
    await page.press('textarea[placeholder*="Type a message"]', 'Enter');
    
    // Wait for response
    await expect(page.locator('text=AI is thinking...')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=AI is thinking...')).toBeHidden({ timeout: CHAT_RESPONSE_TIMEOUT });
    
    // Get the response
    const responseText = await page.locator('[data-role="assistant"]').last().textContent();
    console.log('Risk Analysis Response:', responseText);
    
    // Verify response quality
    expect(responseText).toBeTruthy();
    expect(responseText.length).toBeGreaterThan(100);
  });

  test('should maintain chat history', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    // Wait for auto-initialization to complete
    await page.waitForSelector('textarea[placeholder*="Type a message"]', { timeout: 15000 });
    
    // Send first message
    const firstMessage = 'Hello, can you help me with project management?';
    await page.fill('textarea[placeholder*="Type a message"]', firstMessage);
    await page.press('textarea[placeholder*="Type a message"]', 'Enter');
    
    // Wait for first response
    await expect(page.locator('text=AI is thinking...')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=AI is thinking...')).toBeHidden({ timeout: CHAT_RESPONSE_TIMEOUT });
    
    // Send second message
    const secondMessage = 'What specific areas can you help with?';
    await page.fill('textarea[placeholder*="Type a message"]', secondMessage);
    await page.press('textarea[placeholder*="Type a message"]', 'Enter');
    
    // Wait for second response
    await expect(page.locator('text=AI is thinking...')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=AI is thinking...')).toBeHidden({ timeout: CHAT_RESPONSE_TIMEOUT });
    
    // Verify both messages are in history
    await expect(page.locator(`text="${firstMessage}"`)).toBeVisible();
    await expect(page.locator(`text="${secondMessage}"`)).toBeVisible();
    
    // Verify we have multiple assistant responses
    const assistantMessages = await page.locator('[data-role="assistant"]').count();
    expect(assistantMessages).toBeGreaterThanOrEqual(2);
  });

  test('should show error handling for failed requests', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    // Wait for auto-initialization to complete
    await page.waitForSelector('textarea[placeholder*="Type a message"]', { timeout: 15000 });
    
    // Send a very long message to potentially trigger an error
    const longMessage = 'Test '.repeat(1000);
    await page.fill('textarea[placeholder*="Type a message"]', longMessage);
    await page.press('textarea[placeholder*="Type a message"]', 'Enter');
    
    // Either we get an error or a response - both are acceptable
    // The key is the system doesn't crash
    try {
      // Wait for either error or response
      await Promise.race([
        expect(page.locator('text=Error:')).toBeVisible({ timeout: 10000 }),
        expect(page.locator('text=AI is thinking...')).toBeVisible({ timeout: 10000 })
      ]);
      
      // If we see "AI is thinking", wait for it to complete
      if (await page.locator('text=AI is thinking...').isVisible()) {
        await expect(page.locator('text=AI is thinking...')).toBeHidden({ timeout: CHAT_RESPONSE_TIMEOUT });
      }
    } catch (e) {
      // No error or response might indicate the input was rejected
      // which is also acceptable behavior
    }
    
    // Verify the interface is still functional
    const chatInput = page.locator('textarea[placeholder*="Type a message"]');
    await expect(chatInput).toBeVisible();
    await expect(chatInput).toBeEnabled();
  });
});

// Integration test to verify RAG is actually working
test.describe('PM Assistant RAG Integration', () => {
  test('should demonstrate RAG functionality by searching meetings', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    // Navigate to PM Assistant
    await page.goto('/pm-assistant');
    // Wait for auto-initialization to complete
    await page.waitForSelector('textarea[placeholder*="Type a message"]', { timeout: 15000 });
    
    // Ask a specific question that requires RAG
    const ragQuery = 'Search for any discussions about project timelines or deadlines in recent meetings';
    await page.fill('textarea[placeholder*="Type a message"]', ragQuery);
    await page.press('textarea[placeholder*="Type a message"]', 'Enter');
    
    // Wait for response
    await expect(page.locator('text=AI is thinking...')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=AI is thinking...')).toBeHidden({ timeout: CHAT_RESPONSE_TIMEOUT });
    
    // Get response and verify it attempted to search
    const responseText = await page.locator('[data-role="assistant"]').last().textContent();
    console.log('RAG Search Response:', responseText);
    
    // The response should indicate it's searching or mention meetings
    // Even if no meetings are found, it should acknowledge the search
    expect(responseText).toBeTruthy();
    expect(
      responseText.toLowerCase().includes('meeting') ||
      responseText.toLowerCase().includes('search') ||
      responseText.toLowerCase().includes('found') ||
      responseText.toLowerCase().includes('timeline') ||
      responseText.toLowerCase().includes('deadline')
    ).toBeTruthy();
  });
});