import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'test.user@testcompany.com',
  password: 'TestPassword123!'
};

// Use the correct base URL
test.use({
  baseURL: 'http://localhost:3001',
});

test.describe('PM Assistant with Authentication', () => {
  test('should log in and test PM Assistant functionality', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*auth\/login/);
    
    // Fill in login form
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Submit login
    await page.click('button:has-text("Login")');
    
    // Wait for redirect after login
    await page.waitForURL('/', { timeout: 10000 });
    
    // Navigate to PM Assistant
    await page.goto('/pm-assistant');
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/pm-assistant-initial.png' });
    
    // Check if page loads without errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Check for the minimal header
    await expect(page.locator('h1:has-text("PM Assistant")')).toBeVisible();
    
    // Check if there are any JavaScript errors
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }
    
    // Try to type in the chat input if it exists
    const chatInput = page.locator('textarea[placeholder*="Message"]');
    const inputExists = await chatInput.count() > 0;
    
    if (inputExists) {
      console.log('Chat input found - trying to type');
      await chatInput.fill('Hello, test message');
      await page.screenshot({ path: 'test-results/pm-assistant-with-text.png' });
    } else {
      console.log('Chat input not found - checking for errors');
      await page.screenshot({ path: 'test-results/pm-assistant-error-state.png' });
    }
    
    // Report findings
    console.log('Test completed');
    console.log('Console errors:', consoleErrors.length);
    console.log('Chat input found:', inputExists);
  });

  test('should check test-chat debug page', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*auth\/login/);
    
    // Fill in login form
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Submit login
    await page.click('button:has-text("Login")');
    
    // Wait for redirect after login
    await page.waitForURL('/', { timeout: 10000 });
    
    // Navigate to test chat page
    await page.goto('/test-chat');
    
    // Wait for console output
    await page.waitForTimeout(2000);
    
    // Get the console output
    const consoleOutput: string[] = [];
    page.on('console', (msg) => {
      consoleOutput.push(`${msg.type()}: ${msg.text()}`);
    });
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/test-chat-debug.png' });
    
    console.log('Console output from test-chat page:', consoleOutput);
  });
});