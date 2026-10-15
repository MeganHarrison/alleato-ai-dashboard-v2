import { test, expect } from '@playwright/test';

test.describe('AI Chat - ChatGPT Style Interface', () => {
  test('should display ChatGPT-style welcome screen', async ({ page }) => {
    await page.goto('http://localhost:3000/ai-chat');
    
    // Check for ChatGPT branding
    await expect(page.getByRole('heading', { name: 'ChatGPT' })).toBeVisible();
    
    // Check for welcome message
    await expect(page.getByRole('heading', { name: 'How can I help you today?' })).toBeVisible();
    
    // Check for green bot icon
    await expect(page.locator('.bg-green-500')).toBeVisible();
    
    // Check for suggestion cards
    await expect(page.getByText('Show me recent meeting insights')).toBeVisible();
    await expect(page.getByText('What decisions need to be made?')).toBeVisible();
    await expect(page.getByText('Give me the weekly summary')).toBeVisible();
    await expect(page.getByText('What\'s happening with our projects?')).toBeVisible();
    
    // Check for input field with placeholder
    await expect(page.getByPlaceholder('Message ChatGPT')).toBeVisible();
    
    // Check for send button with arrow up icon
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should interact with suggestion cards', async ({ page }) => {
    await page.goto('http://localhost:3000/ai-chat');
    
    // Click on a suggestion card
    await page.getByText('Show me recent meeting insights').click();
    
    // Check that the input field is populated with the suggestion text
    await expect(page.getByPlaceholder('Message ChatGPT')).toHaveValue('Show me recent meeting insights');
  });

  test('should handle chat functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/ai-chat');
    
    // Type a message
    const inputField = page.getByPlaceholder('Message ChatGPT');
    await inputField.fill('Tell me about recent meetings');
    
    // Submit the message
    await page.getByRole('button', { name: /submit/i }).click();
    
    // Wait for the loading state to appear
    await expect(page.locator('.animate-pulse')).toBeVisible({ timeout: 5000 });
    
    // Wait for response (with longer timeout for API call)
    await expect(page.getByText('Tell me about recent meetings')).toBeVisible({ timeout: 10000 });
    
    // Wait for and verify the response appears
    await page.waitForSelector('div[role="assistant"]', { timeout: 30000 });
    
    // Take a screenshot showing the working chat interface
    await page.screenshot({ 
      path: 'screenshots/ai-chat-chatgpt-style-working.png',
      fullPage: true 
    });
  });

  test('should display clean ChatGPT-style design', async ({ page }) => {
    await page.goto('http://localhost:3000/ai-chat');
    
    // Check for white background
    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', /white|rgb\(255,\s*255,\s*255\)/);
    
    // Check for proper styling elements
    await expect(page.locator('.rounded-3xl')).toBeVisible(); // Rounded input
    await expect(page.locator('.rounded-full')).toBeVisible(); // Rounded avatars/buttons
    
    // Take a screenshot of the welcome screen
    await page.screenshot({ 
      path: 'screenshots/ai-chat-welcome-screen.png',
      fullPage: true 
    });
  });
});