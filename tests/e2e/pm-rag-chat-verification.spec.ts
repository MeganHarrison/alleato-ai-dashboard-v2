import { test, expect } from '@playwright/test';

test.describe('PM RAG Chat Pages Verification', () => {
  test.setTimeout(60000); // Set timeout to 60 seconds for AI responses

  test('pm-rag page chat should work with project-specific queries', async ({ page }) => {
    // Navigate to pm-rag page
    await page.goto('http://localhost:3005/pm-rag');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on RAG Chat tab if not active
    const chatTab = page.locator('button[role="tab"]:has-text("RAG Chat")');
    await chatTab.click();
    
    // Wait for chat interface to be visible
    await page.waitForSelector('textarea[placeholder*="Ask about meetings"]', { timeout: 10000 });
    
    // Type a project-specific question
    const textarea = page.locator('textarea[placeholder*="Ask about meetings"]');
    await textarea.fill('What are the recent AI insights for Tampa or Vermillion Rise projects?');
    
    // Submit the message
    const sendButton = page.locator('button[type="submit"]').first();
    await sendButton.click();
    
    // Wait for AI response (looking for thinking indicator first)
    await page.waitForSelector('text=/Analyzing meetings|Thinking/i', { timeout: 15000 });
    
    // Wait for actual response content
    await page.waitForFunction(
      () => {
        const messages = document.querySelectorAll('[class*="rounded-lg"][class*="p-3"]');
        const lastMessage = messages[messages.length - 1];
        return lastMessage && lastMessage.textContent && lastMessage.textContent.length > 50;
      },
      { timeout: 30000 }
    );
    
    // Verify response contains relevant project information
    const responseText = await page.locator('[class*="rounded-lg"][class*="p-3"]').last().textContent();
    console.log('PM-RAG Response:', responseText);
    
    // Check that response is relevant and substantial
    expect(responseText).toBeTruthy();
    expect(responseText.length).toBeGreaterThan(50);
    
    // Take screenshot for documentation
    await page.screenshot({ path: 'screenshots/pm-rag-chat-test.png', fullPage: true });
  });

  test('rag-system chat page should work with PM RAG API', async ({ page }) => {
    // Navigate to rag-system chat page
    await page.goto('http://localhost:3005/rag-system/chat');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for chat interface
    await page.waitForSelector('textarea[placeholder*="Ask a question"]', { timeout: 10000 });
    
    // Type a question about meetings
    const textarea = page.locator('textarea[placeholder*="Ask a question"]');
    await textarea.fill('What action items or risks have been identified in recent meetings?');
    
    // Submit the message
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();
    
    // Wait for thinking indicator
    await page.waitForSelector('text=/Thinking/i', { timeout: 15000 });
    
    // Wait for response
    await page.waitForFunction(
      () => {
        const messages = document.querySelectorAll('[class*="rounded-lg"]');
        if (messages.length < 2) return false;
        const lastMessage = messages[messages.length - 1];
        const content = lastMessage?.textContent || '';
        return content.length > 50 && !content.includes('Thinking');
      },
      { timeout: 30000 }
    );
    
    // Get response content
    const responseText = await page.locator('[class*="rounded-lg"]').last().textContent();
    console.log('RAG-System Response:', responseText);
    
    // Verify response quality
    expect(responseText).toBeTruthy();
    expect(responseText.length).toBeGreaterThan(50);
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/rag-system-chat-test.png', fullPage: true });
  });

  test('pm-chat-working page should stream responses correctly', async ({ page }) => {
    // Navigate to pm-chat-working page
    await page.goto('http://localhost:3005/pm-chat-working');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for chat interface with welcome message
    await page.waitForSelector('text=/Hello! I\'m your PM Assistant/i', { timeout: 10000 });
    
    // Type a question
    const input = page.locator('input[placeholder*="Ask about meetings"]');
    await input.fill('Summarize the health and status of all current projects');
    
    // Submit the message
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();
    
    // Wait for streaming to start (loading indicator)
    await page.waitForSelector('text=/Searching meetings and analyzing data/i', { timeout: 15000 });
    
    // Wait for response to complete
    await page.waitForFunction(
      () => {
        const loadingIndicator = document.querySelector('[class*="animate-spin"]');
        const messages = document.querySelectorAll('[class*="rounded-lg"][class*="p-3"]');
        const lastMessage = messages[messages.length - 1];
        return !loadingIndicator && lastMessage && lastMessage.textContent && lastMessage.textContent.length > 50;
      },
      { timeout: 30000 }
    );
    
    // Get the response
    const responseText = await page.locator('[class*="rounded-lg"][class*="p-3"]').last().textContent();
    console.log('PM-Chat-Working Response:', responseText);
    
    // Verify streaming worked
    expect(responseText).toBeTruthy();
    expect(responseText.length).toBeGreaterThan(50);
    
    // Check debug info shows correct API
    const debugInfo = await page.locator('text=/API: \/api\/pm-rag-fallback/').textContent();
    expect(debugInfo).toContain('/api/pm-rag-fallback');
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/pm-chat-working-test.png', fullPage: true });
  });

  test('rag-chat page should work with proxy endpoint', async ({ page }) => {
    // Navigate to rag-chat page
    await page.goto('http://localhost:3005/rag-chat');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for chat interface
    await page.waitForSelector('[placeholder*="Type your message"]', { timeout: 10000 });
    
    // Type a question
    const input = page.locator('[placeholder*="Type your message"]');
    await input.fill('What are the key decisions and outcomes from the most recent project meetings?');
    
    // Press Enter to send
    await input.press('Enter');
    
    // Wait for response to start
    await page.waitForSelector('[class*="animate-pulse"], [class*="animate-spin"], text=/Processing/, text=/Thinking/', { timeout: 15000 });
    
    // Wait for response to complete
    await page.waitForFunction(
      () => {
        const spinners = document.querySelectorAll('[class*="animate-spin"], [class*="animate-pulse"]');
        const messages = document.querySelectorAll('[class*="message"], [class*="rounded"], [class*="p-"]');
        const hasContent = Array.from(messages).some(msg => {
          const text = msg.textContent || '';
          return text.length > 50 && !text.includes('Processing') && !text.includes('Thinking');
        });
        return spinners.length === 0 && hasContent;
      },
      { timeout: 30000 }
    );
    
    // Get response
    const messages = await page.locator('[class*="message"], [class*="rounded"]').allTextContents();
    const responseText = messages[messages.length - 1];
    console.log('RAG-Chat Proxy Response:', responseText);
    
    // Verify response
    expect(responseText).toBeTruthy();
    expect(responseText.length).toBeGreaterThan(50);
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/rag-chat-proxy-test.png', fullPage: true });
  });

  test('verify PM RAG API health and data availability', async ({ page }) => {
    // Check API health directly
    const response = await page.request.get('http://localhost:3005/api/pm-rag-fallback');
    const health = await response.json();
    
    console.log('PM RAG API Health:', health);
    
    // Verify API is healthy and has data
    expect(health.status).toBe('healthy');
    expect(health.meetings_count).toBeGreaterThan(0);
    expect(health.insights_count).toBeGreaterThan(0);
    
    // Also check the proxy endpoint
    const proxyResponse = await page.request.get('http://localhost:3005/api/rag-proxy');
    const proxyHealth = await proxyResponse.json();
    
    console.log('RAG Proxy Health:', proxyHealth);
    expect(proxyHealth.endpoint).toBe('PM RAG Fallback API');
  });
});