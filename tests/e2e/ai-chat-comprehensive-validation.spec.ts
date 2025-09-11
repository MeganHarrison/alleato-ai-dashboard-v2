import { test, expect } from '@playwright/test';

/**
 * Comprehensive AI Chat Validation Suite
 * 
 * This test suite validates the complete AI chat functionality for the Alleato AI Dashboard,
 * including the main chat component, API routes, streaming responses, error handling,
 * state management, and integration with external services.
 */

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

// Test data for various chat scenarios
const TEST_MESSAGES = {
  general: {
    query: "What is your primary function as a Project Management Assistant?",
    expectedKeywords: ["project", "management", "assist", "help", "insights"]
  },
  projectInsights: {
    query: "Can you provide insights from my recent meetings?",
    expectedKeywords: ["meeting", "insight", "project", "data"]
  },
  taskManagement: {
    query: "How can I track action items from meetings?",
    expectedKeywords: ["action", "item", "track", "task", "meeting"]
  },
  railwayRag: {
    query: "Show me meeting summaries from last week",
    expectedKeywords: ["meeting", "summary", "week"]
  },
  errorTrigger: {
    query: "This is a test message to check error handling: " + "x".repeat(1000),
    expectedResponse: "error"
  }
};

test.describe('AI Chat Comprehensive Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for AI responses
    page.setDefaultTimeout(TEST_TIMEOUT);
    
    // Navigate to the main dashboard
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  /**
   * Test 1: AI Chat Component UI/UX
   * Validates the floating chat button, modal functionality, and basic interactions
   */
  test('AI Chat Component - UI/UX Validation', async ({ page }) => {
    console.log('🧪 Testing AI Chat Component UI/UX...');
    
    // Check if floating chat button is present
    const chatButton = page.locator('button').filter({ hasText: /Bot|Chat|Assistant/i }).first();
    await expect(chatButton).toBeVisible({ timeout: 5000 });
    
    // Click to open chat modal
    await chatButton.click();
    
    // Verify chat modal opens
    const chatModal = page.locator('[class*="fixed"]').filter({ has: page.locator('h3:has-text("PM Assistant")') });
    await expect(chatModal).toBeVisible();
    
    // Check chat components are present
    await expect(page.locator('h3:has-text("PM Assistant")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Ask"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Test minimize functionality
    const minimizeButton = page.locator('button').filter({ has: page.locator('svg') }).nth(0);
    await minimizeButton.click();
    
    // Verify chat minimizes
    const minimizedChat = page.locator('[class*="h-14 w-64"]');
    await expect(minimizedChat).toBeVisible();
    
    // Test maximize functionality
    const maximizeButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await maximizeButton.click();
    
    // Verify chat expands again
    await expect(page.locator('[class*="h-[500px] w-[380px]"]')).toBeVisible();
    
    // Test close functionality
    const closeButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
    await closeButton.click();
    
    // Verify chat closes
    await expect(chatModal).not.toBeVisible();
    
    await page.screenshot({ path: 'screenshots/ai-chat-ui-validation.png', fullPage: true });
    console.log('✅ AI Chat Component UI/UX test passed');
  });

  /**
   * Test 2: Basic Chat Functionality
   * Tests sending messages and receiving responses
   */
  test('AI Chat - Basic Functionality', async ({ page }) => {
    console.log('🧪 Testing AI Chat Basic Functionality...');
    
    // Open chat
    const chatButton = page.locator('button').filter({ hasText: /Bot|Chat|Assistant/i }).first();
    await chatButton.click();
    
    // Send a test message
    const input = page.locator('input[placeholder*="Ask"]');
    const sendButton = page.locator('button[type="submit"]');
    
    await input.fill(TEST_MESSAGES.general.query);
    await expect(sendButton).toBeEnabled();
    
    // Submit message
    await sendButton.click();
    
    // Verify message appears in chat
    await expect(page.locator('text=' + TEST_MESSAGES.general.query)).toBeVisible();
    
    // Wait for loading indicator
    const loadingIndicator = page.locator('[class*="animate-bounce"]').first();
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).not.toBeVisible({ timeout: 30000 });
    }
    
    // Wait for AI response
    const responseContainer = page.locator('[class*="bg-gray-50"]').last();
    await expect(responseContainer).toBeVisible({ timeout: 30000 });
    
    // Verify response contains expected keywords
    const responseText = await responseContainer.textContent();
    const hasRelevantKeywords = TEST_MESSAGES.general.expectedKeywords.some(keyword => 
      responseText?.toLowerCase().includes(keyword.toLowerCase())
    );
    
    expect(hasRelevantKeywords).toBe(true);
    
    // Test input clears after sending
    await expect(input).toHaveValue('');
    
    await page.screenshot({ path: 'screenshots/ai-chat-basic-functionality.png', fullPage: true });
    console.log('✅ AI Chat Basic Functionality test passed');
  });

  /**
   * Test 3: Message History and State Management
   * Tests conversation flow and message persistence
   */
  test('AI Chat - Message History and State', async ({ page }) => {
    console.log('🧪 Testing AI Chat Message History and State Management...');
    
    // Open chat
    const chatButton = page.locator('button').filter({ hasText: /Bot|Chat|Assistant/i }).first();
    await chatButton.click();
    
    const input = page.locator('input[placeholder*="Ask"]');
    const sendButton = page.locator('button[type="submit"]');
    
    // Send multiple messages to test conversation flow
    const messages = [
      "Hello, I'm testing the chat system.",
      "Can you remember what I just said?",
      "What was my first message?"
    ];
    
    for (let i = 0; i < messages.length; i++) {
      await input.fill(messages[i]);
      await sendButton.click();
      
      // Wait for message to appear
      await expect(page.locator(`text=${messages[i]}`)).toBeVisible();
      
      // Wait for response before sending next message
      await page.waitForTimeout(2000);
      
      // Check if response appears
      const responses = page.locator('[class*="bg-gray-50"]');
      await expect(responses).toHaveCount(i + 2); // +1 for initial message, +1 for current response
    }
    
    // Test chat state persistence on minimize/maximize
    const minimizeButton = page.locator('button').filter({ has: page.locator('svg') }).nth(0);
    await minimizeButton.click();
    
    const maximizeButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await maximizeButton.click();
    
    // Verify all messages are still there
    for (const message of messages) {
      await expect(page.locator(`text=${message}`)).toBeVisible();
    }
    
    await page.screenshot({ path: 'screenshots/ai-chat-message-history.png', fullPage: true });
    console.log('✅ AI Chat Message History and State test passed');
  });

  /**
   * Test 4: Error Handling
   * Tests various error scenarios and graceful degradation
   */
  test('AI Chat - Error Handling', async ({ page }) => {
    console.log('🧪 Testing AI Chat Error Handling...');
    
    // Open chat
    const chatButton = page.locator('button').filter({ hasText: /Bot|Chat|Assistant/i }).first();
    await chatButton.click();
    
    const input = page.locator('input[placeholder*="Ask"]');
    const sendButton = page.locator('button[type="submit"]');
    
    // Test empty input validation
    await sendButton.click();
    await expect(input).toBeFocused();
    
    // Test extremely long input
    await input.fill(TEST_MESSAGES.errorTrigger.query);
    await sendButton.click();
    
    // Should still process or show appropriate error
    await expect(page.locator(`text=${TEST_MESSAGES.errorTrigger.query.substring(0, 50)}`)).toBeVisible();
    
    // Wait for response (could be error or processed response)
    await page.waitForTimeout(5000);
    const lastResponse = page.locator('[class*="bg-gray-50"]').last();
    await expect(lastResponse).toBeVisible();
    
    // Test button disable during loading
    await input.fill("Another test message");
    await sendButton.click();
    
    // Button should be disabled while loading
    await expect(sendButton).toBeDisabled();
    
    // Wait for response and button to re-enable
    await page.waitForTimeout(5000);
    await expect(sendButton).toBeEnabled();
    
    await page.screenshot({ path: 'screenshots/ai-chat-error-handling.png', fullPage: true });
    console.log('✅ AI Chat Error Handling test passed');
  });

  /**
   * Test 5: Mobile Responsiveness
   * Tests chat functionality on mobile viewport
   */
  test('AI Chat - Mobile Responsiveness', async ({ page }) => {
    console.log('🧪 Testing AI Chat Mobile Responsiveness...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Find and open chat
    const chatButton = page.locator('button').filter({ hasText: /Bot|Chat|Assistant/i }).first();
    await expect(chatButton).toBeVisible();
    await chatButton.click();
    
    // Verify chat adapts to mobile screen
    const chatModal = page.locator('[class*="fixed"]').filter({ has: page.locator('h3:has-text("PM Assistant")') });
    await expect(chatModal).toBeVisible();
    
    // Check if chat interface is usable on mobile
    const input = page.locator('input[placeholder*="Ask"]');
    const sendButton = page.locator('button[type="submit"]');
    
    await expect(input).toBeVisible();
    await expect(sendButton).toBeVisible();
    
    // Test sending a message on mobile
    await input.fill("Mobile test message");
    await sendButton.click();
    
    // Verify message appears
    await expect(page.locator('text=Mobile test message')).toBeVisible();
    
    // Test scrolling behavior
    const messagesContainer = page.locator('[class*="overflow-y-auto"]');
    await expect(messagesContainer).toBeVisible();
    
    await page.screenshot({ path: 'screenshots/ai-chat-mobile-responsive.png', fullPage: true });
    console.log('✅ AI Chat Mobile Responsiveness test passed');
  });

  /**
   * Test 6: API Integration Health Check
   * Tests the health of chat API endpoints
   */
  test('AI Chat - API Integration Health', async ({ page }) => {
    console.log('🧪 Testing AI Chat API Integration Health...');
    
    // Test chat API endpoint
    const chatApiResponse = await page.request.post(`${BASE_URL}/api/chat`, {
      data: {
        messages: [
          { role: 'user', content: 'API health check test' }
        ]
      }
    });
    
    console.log(`Chat API Status: ${chatApiResponse.status()}`);
    expect(chatApiResponse.status()).toBeLessThan(500); // Should not be server error
    
    // Test railway chat API endpoint
    const railwayChatResponse = await page.request.get(`${BASE_URL}/api/railway-chat`);
    console.log(`Railway Chat API Status: ${railwayChatResponse.status()}`);
    
    if (railwayChatResponse.ok()) {
      const healthData = await railwayChatResponse.json();
      expect(healthData).toHaveProperty('status');
    }
    
    // Test PM RAG endpoint
    const pmRagResponse = await page.request.post(`${BASE_URL}/api/pm-rag`, {
      data: {
        query: 'Health check test',
        test: true
      }
    });
    
    console.log(`PM RAG API Status: ${pmRagResponse.status()}`);
    expect(pmRagResponse.status()).toBeLessThan(500);
    
    console.log('✅ AI Chat API Integration Health test completed');
  });

  /**
   * Test 7: Performance and Loading
   * Tests chat performance and loading states
   */
  test('AI Chat - Performance and Loading', async ({ page }) => {
    console.log('🧪 Testing AI Chat Performance and Loading...');
    
    // Measure chat opening time
    const startTime = Date.now();
    
    const chatButton = page.locator('button').filter({ hasText: /Bot|Chat|Assistant/i }).first();
    await chatButton.click();
    
    const chatModal = page.locator('[class*="fixed"]').filter({ has: page.locator('h3:has-text("PM Assistant")') });
    await expect(chatModal).toBeVisible();
    
    const openTime = Date.now() - startTime;
    console.log(`Chat opened in ${openTime}ms`);
    expect(openTime).toBeLessThan(2000); // Should open within 2 seconds
    
    // Test message sending performance
    const input = page.locator('input[placeholder*="Ask"]');
    const sendButton = page.locator('button[type="submit"]');
    
    const messageStartTime = Date.now();
    await input.fill("Performance test message");
    await sendButton.click();
    
    // Wait for loading state to appear
    const loadingIndicator = page.locator('[class*="animate-bounce"]').first();
    if (await loadingIndicator.isVisible()) {
      console.log('Loading indicator appeared');
      await expect(loadingIndicator).not.toBeVisible({ timeout: 30000 });
    }
    
    // Wait for response
    const responseContainer = page.locator('[class*="bg-gray-50"]').last();
    await expect(responseContainer).toBeVisible({ timeout: 30000 });
    
    const responseTime = Date.now() - messageStartTime;
    console.log(`Response received in ${responseTime}ms`);
    
    // Verify response time is reasonable
    expect(responseTime).toBeLessThan(30000); // Should respond within 30 seconds
    
    await page.screenshot({ path: 'screenshots/ai-chat-performance.png', fullPage: true });
    console.log('✅ AI Chat Performance test passed');
  });

  /**
   * Test 8: Integration with Real User Scenarios
   * Tests realistic user workflows and interactions
   */
  test('AI Chat - Real User Scenarios', async ({ page }) => {
    console.log('🧪 Testing AI Chat Real User Scenarios...');
    
    // Open chat
    const chatButton = page.locator('button').filter({ hasText: /Bot|Chat|Assistant/i }).first();
    await chatButton.click();
    
    const input = page.locator('input[placeholder*="Ask"]');
    const sendButton = page.locator('button[type="submit"]');
    
    // Scenario 1: Project Manager asking for meeting insights
    await input.fill(TEST_MESSAGES.projectInsights.query);
    await sendButton.click();
    
    await expect(page.locator(`text=${TEST_MESSAGES.projectInsights.query}`)).toBeVisible();
    
    // Wait for and verify response
    await page.waitForTimeout(3000);
    const response1 = page.locator('[class*="bg-gray-50"]').nth(1);
    await expect(response1).toBeVisible();
    
    // Scenario 2: Follow-up question about task management
    await page.waitForTimeout(2000);
    await input.fill(TEST_MESSAGES.taskManagement.query);
    await sendButton.click();
    
    await expect(page.locator(`text=${TEST_MESSAGES.taskManagement.query}`)).toBeVisible();
    
    // Wait for response
    await page.waitForTimeout(3000);
    const response2 = page.locator('[class*="bg-gray-50"]').nth(2);
    await expect(response2).toBeVisible();
    
    // Scenario 3: Request for specific data
    await page.waitForTimeout(2000);
    await input.fill(TEST_MESSAGES.railwayRag.query);
    await sendButton.click();
    
    await expect(page.locator(`text=${TEST_MESSAGES.railwayRag.query}`)).toBeVisible();
    
    // Wait for response
    await page.waitForTimeout(5000);
    const response3 = page.locator('[class*="bg-gray-50"]').nth(3);
    await expect(response3).toBeVisible();
    
    // Verify all messages are still visible (conversation history)
    await expect(page.locator(`text=${TEST_MESSAGES.projectInsights.query}`)).toBeVisible();
    await expect(page.locator(`text=${TEST_MESSAGES.taskManagement.query}`)).toBeVisible();
    await expect(page.locator(`text=${TEST_MESSAGES.railwayRag.query}`)).toBeVisible();
    
    await page.screenshot({ path: 'screenshots/ai-chat-real-user-scenarios.png', fullPage: true });
    console.log('✅ AI Chat Real User Scenarios test passed');
  });
});

/**
 * Utility function to wait for AI response with better error handling
 */
async function waitForAIResponse(page: any, timeout = 30000) {
  try {
    const responseContainer = page.locator('[class*="bg-gray-50"]').last();
    await expect(responseContainer).toBeVisible({ timeout });
    return true;
  } catch (error) {
    console.log('AI response timeout or error:', error);
    return false;
  }
}

/**
 * Utility function to check if loading indicator is present and disappears
 */
async function waitForLoadingToComplete(page: any, timeout = 30000) {
  try {
    const loadingIndicator = page.locator('[class*="animate-bounce"]').first();
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).not.toBeVisible({ timeout });
    }
    return true;
  } catch (error) {
    console.log('Loading indicator timeout:', error);
    return false;
  }
}