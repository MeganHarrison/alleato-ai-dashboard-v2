import { test, expect } from '@playwright/test';

test.describe('FM Global RAG System Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the FM Global advanced interface
    await page.goto('http://localhost:3006/fm-global-advanced');
  });

  test('should load page and show connection status', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page title is correct
    await expect(page).toHaveTitle(/FM Global Advanced/);
    
    // Look for connection status indicator
    await expect(page.getByText(/Python Agent/)).toBeVisible();
    
    // Take a screenshot of the initial page load
    await page.screenshot({ 
      path: 'screenshots/fm-global-initial-load.png', 
      fullPage: true 
    });
  });

  test('should test sprinkler requirements question', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for connection status to be established
    await page.waitForSelector('[data-testid="connection-status"]', { timeout: 10000 });
    
    // Find the message input and type a question
    const messageInput = page.locator('input[type="text"], textarea').first();
    await messageInput.fill('What are the sprinkler requirements for shuttle ASRS systems?');
    
    // Submit the message
    await page.keyboard.press('Enter');
    
    // Wait for the response
    await page.waitForSelector('[data-testid="message"]', { timeout: 30000 });
    
    // Check that we got a response
    const messages = page.locator('[data-testid="message"]');
    await expect(messages).toHaveCount(1);
    
    // Take a screenshot of the conversation
    await page.screenshot({ 
      path: 'screenshots/fm-global-sprinkler-question.png', 
      fullPage: true 
    });
  });

  test('should test clearance requirements question', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for connection status to be established
    await page.waitForSelector('[data-testid="connection-status"]', { timeout: 10000 });
    
    // Find the message input and type a question
    const messageInput = page.locator('input[type="text"], textarea').first();
    await messageInput.fill('What are the clearance requirements for storage systems?');
    
    // Submit the message
    await page.keyboard.press('Enter');
    
    // Wait for the response
    await page.waitForSelector('[data-testid="message"]', { timeout: 30000 });
    
    // Check that we got a response
    const messages = page.locator('[data-testid="message"]');
    await expect(messages).toHaveCount(1);
    
    // Take a screenshot of the conversation
    await page.screenshot({ 
      path: 'screenshots/fm-global-clearance-question.png', 
      fullPage: true 
    });
  });

  test('should show comprehensive conversation', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for connection status to be established
    await page.waitForSelector('[data-testid="connection-status"]', { timeout: 10000 });
    
    // Ask multiple questions to show a comprehensive conversation
    const questions = [
      'What are the sprinkler requirements for shuttle ASRS systems?',
      'What clearance requirements apply to storage systems?',
      'What fire protection measures are needed for automated storage?'
    ];
    
    const messageInput = page.locator('input[type="text"], textarea').first();
    
    for (const question of questions) {
      await messageInput.fill(question);
      await page.keyboard.press('Enter');
      
      // Wait for response before asking next question
      await page.waitForTimeout(3000);
    }
    
    // Wait for all responses to complete
    await page.waitForTimeout(10000);
    
    // Take a final screenshot showing the complete conversation
    await page.screenshot({ 
      path: 'screenshots/fm-global-complete-conversation.png', 
      fullPage: true 
    });
  });
});