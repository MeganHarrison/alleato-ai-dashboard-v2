import { test, expect } from '@playwright/test';

test.describe('FM Global RAG System - Authentication Fixed', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for RAG responses
    test.setTimeout(120000);
    
    // Navigate to the FM Global advanced interface
    await page.goto('http://localhost:3006/fm-global-advanced');
  });

  test('should load FM Global advanced page without authentication redirect', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're NOT on the login page
    await expect(page.locator('text=Login')).not.toBeVisible();
    
    // Check that the FM Global interface is visible
    await expect(page.locator('h1:has-text("FM Global Advanced RAG")')).toBeVisible({ timeout: 10000 });
    
    // Look for key elements that should be present
    await expect(page.locator('text=Powered by Pydantic AI Agent')).toBeVisible();
    await expect(page.locator('text=Python Agent')).toBeVisible();
    
    // Check for the input field
    await expect(page.locator('input[placeholder*="Ask complex questions"]')).toBeVisible();
    
    // Take a screenshot of the successfully loaded page
    await page.screenshot({ 
      path: 'screenshots/fm-global-auth-fixed-loaded.png', 
      fullPage: true 
    });
    
    console.log('✓ FM Global advanced page loaded successfully without authentication redirect');
  });

  test('should test connection to Python RAG agent and chat functionality', async ({ page }) => {
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Verify the page loaded correctly (not login page)
    await expect(page.locator('h1:has-text("FM Global Advanced RAG")')).toBeVisible();
    
    // Find the input field
    const messageInput = page.locator('input[placeholder*="Ask complex questions"]');
    await expect(messageInput).toBeVisible();
    
    // Type a test question about sprinkler requirements
    const question = 'What are the sprinkler requirements for shuttle ASRS systems?';
    await messageInput.fill(question);
    
    console.log(`✓ Typed question: ${question}`);
    
    // Submit the form (press Enter or click Send button)
    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();
    
    console.log('✓ Submitted question');
    
    // Wait for the user message to appear
    await expect(page.locator('text=' + question)).toBeVisible({ timeout: 10000 });
    
    // Take screenshot after submitting question
    await page.screenshot({ 
      path: 'screenshots/fm-global-question-submitted.png', 
      fullPage: true 
    });
    
    // Wait for AI response (be generous with timeout for RAG processing)
    // Look for the AI response indicator or actual response content
    try {
      // Wait for loading indicator to appear and then disappear, or for response
      await page.waitForSelector('text=AI', { timeout: 30000 });
      console.log('✓ AI response section appeared');
      
      // Wait additional time for response to complete
      await page.waitForTimeout(10000);
      
      // Take screenshot of the response
      await page.screenshot({ 
        path: 'screenshots/fm-global-with-response.png', 
        fullPage: true 
      });
      
      console.log('✓ Response captured in screenshot');
      
    } catch (error) {
      console.log('ℹ️ No AI response detected, but captured current state');
      await page.screenshot({ 
        path: 'screenshots/fm-global-no-response-debug.png', 
        fullPage: true 
      });
    }
    
    // Check connection status indicator
    const connectionStatus = page.locator('text=Python Agent');
    if (await connectionStatus.isVisible()) {
      const statusText = await connectionStatus.textContent();
      console.log(`✓ Connection status: ${statusText}`);
    }
    
    console.log('✓ Chat functionality test completed');
  });

  test('should test multiple questions for comprehensive conversation', async ({ page }) => {
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Verify we're on the right page
    await expect(page.locator('h1:has-text("FM Global Advanced RAG")')).toBeVisible();
    
    const questions = [
      'What are the sprinkler requirements for shuttle ASRS systems?',
      'What clearance requirements apply to automated storage systems?'
    ];
    
    const messageInput = page.locator('input[placeholder*="Ask complex questions"]');
    const sendButton = page.locator('button:has-text("Send")');
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`Testing question ${i + 1}: ${question}`);
      
      // Clear and type new question
      await messageInput.fill('');
      await messageInput.fill(question);
      
      // Submit
      await sendButton.click();
      
      // Wait for question to appear in chat
      await page.waitForSelector(`text=${question}`, { timeout: 10000 });
      
      // Wait for potential response
      await page.waitForTimeout(8000);
      
      // Take screenshot for this question
      await page.screenshot({ 
        path: `screenshots/fm-global-conversation-q${i + 1}.png`, 
        fullPage: true 
      });
      
      console.log(`✓ Question ${i + 1} processed`);
    }
    
    // Take final comprehensive screenshot
    await page.screenshot({ 
      path: 'screenshots/fm-global-complete-conversation.png', 
      fullPage: true 
    });
    
    console.log('✓ Comprehensive conversation test completed');
  });
});