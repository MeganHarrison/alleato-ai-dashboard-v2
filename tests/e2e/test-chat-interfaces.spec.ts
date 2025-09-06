import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:3001';

// Test data for chat interactions
const TEST_MESSAGES = {
  general: 'What is your primary function?',
  asrs: 'I have a shuttle ASRS with open-top containers storing Class 3 commodities at 38 feet tall. What sprinkler protection do I need?',
  fmGlobal: 'What are the in-rack sprinkler requirements for open-top containers in a mini-load ASRS?'
};

test.describe('Chat Interfaces Validation', () => {
  // Test the main business chat interface
  test('/chat - Business Expert Chat Interface', async ({ page }) => {
    console.log('Testing /chat interface...');
    
    // Navigate to the chat page
    await page.goto(`${BASE_URL}/chat`);
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    await expect(page.locator('h1')).toContainText('Business Expert Chat');
    
    // Check if input field is present and functional
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeEnabled();
    
    // Test sending a message
    await textarea.fill(TEST_MESSAGES.general);
    
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeEnabled();
    
    // Click send and wait for response
    await sendButton.click();
    
    // Wait for loading state
    await page.waitForSelector('[data-testid="loading"], .animate-spin, :text("Thinking")', { 
      state: 'visible', 
      timeout: 2000 
    }).catch(() => console.log('No loading indicator found'));
    
    // Wait for response (up to 30 seconds)
    await page.waitForSelector(':text("Business Expert")', { timeout: 30000 });
    
    // Verify message was sent and response received
    await expect(page.locator(':text("You")')).toBeVisible();
    await expect(page.locator(':text("Business Expert")')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/chat-interface-working.png', fullPage: true });
    
    console.log('✅ /chat interface test passed');
  });

  // Test the ASRS chat interface (chat-asrs)
  test('/chat-asrs - ASRS Expert Chat Interface', async ({ page }) => {
    console.log('Testing /chat-asrs interface...');
    
    await page.goto(`${BASE_URL}/chat-asrs`);
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    await expect(page.locator('h1')).toContainText('Claude AI Chat');
    
    // Check if input field is present
    const input = page.locator('input[name="prompt"]');
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
    
    // Test sending a message
    await input.fill(TEST_MESSAGES.asrs);
    
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeEnabled();
    
    await sendButton.click();
    
    // Wait for response
    await page.waitForSelector(':text("Claude 4")', { timeout: 30000 });
    
    // Verify interaction worked
    await expect(page.locator(':text("You")')).toBeVisible();
    await expect(page.locator(':text("Claude 4")')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/chat-asrs-interface-working.png', fullPage: true });
    
    console.log('✅ /chat-asrs interface test passed');
  });

  // Test the FM Global ASRS Expert chat (chat-asrs2)
  test('/chat-asrs2 - FM Global ASRS Expert Chat', async ({ page }) => {
    console.log('Testing /chat-asrs2 interface...');
    
    await page.goto(`${BASE_URL}/chat-asrs2`);
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    await expect(page.locator('h1')).toContainText('FM Global ASRS Expert Chat');
    
    // Check if input field is present
    const input = page.locator('input[type="text"]');
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
    
    // Test one of the example queries
    const exampleButton = page.locator('button').first();
    await exampleButton.click();
    
    // Verify the input was filled
    await expect(input).not.toHaveValue('');
    
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeEnabled();
    
    await sendButton.click();
    
    // Wait for response
    await page.waitForSelector(':text("FM Global Expert")', { timeout: 30000 });
    
    // Verify interaction worked
    await expect(page.locator(':text("You")')).toBeVisible();
    await expect(page.locator(':text("FM Global Expert")')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/chat-asrs2-interface-working.png', fullPage: true });
    
    console.log('✅ /chat-asrs2 interface test passed');
  });

  // Test the FM Global form interface
  test('/fm-global-form - FM Global Form Interface', async ({ page }) => {
    console.log('Testing /fm-global-form interface...');
    
    await page.goto(`${BASE_URL}/fm-global-form`);
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    await expect(page.locator('h1')).toContainText('ASRS Sprinkler System Requirements');
    
    // Check if the form is present
    await expect(page.locator('form, .bg-white')).toBeVisible();
    
    // Test the quick API test button if available
    const quickTestButton = page.locator(':text("Test API Directly")');
    if (await quickTestButton.isVisible()) {
      console.log('Testing quick API test...');
      await quickTestButton.click();
      
      // Wait for alert or response
      await page.waitForTimeout(5000);
    }
    
    // Check if form inputs are present
    const formInputs = page.locator('input, select, textarea');
    await expect(formInputs.first()).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/fm-global-form-interface-working.png', fullPage: true });
    
    console.log('✅ /fm-global-form interface test passed');
  });

  // Test API endpoints health
  test('API Endpoints Health Check', async ({ page }) => {
    console.log('Testing API endpoints health...');
    
    const endpoints = [
      '/api/chat',
      '/api/fm-global-chat', 
      '/api/fm-global',
      '/api/fm-global/form',
      '/api/debug'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`Testing ${endpoint}...`);
      
      // Make a test request to each endpoint
      const response = await page.request.post(`${BASE_URL}${endpoint}`, {
        data: { 
          messages: [{ role: 'user', content: 'test' }],
          test: true 
        }
      });
      
      console.log(`${endpoint}: ${response.status()}`);
      
      // Endpoint should not return 404 (should be configured)
      expect(response.status()).not.toBe(404);
    }
    
    console.log('✅ API endpoints health check completed');
  });
});

// Utility function to wait for chat response
export async function waitForChatResponse(page: any, timeout = 30000) {
  // Wait for either a response message or error state
  await Promise.race([
    page.waitForSelector('[data-role="assistant"], :text("AI"), :text("Claude"), :text("Expert")', { timeout }),
    page.waitForSelector('[data-testid="error"], :text("Error"), .text-red', { timeout: 5000 }).catch(() => {})
  ]);
}