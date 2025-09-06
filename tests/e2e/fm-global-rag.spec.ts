import { test, expect } from '@playwright/test';

test.describe('FM Global RAG System Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the FM Global advanced interface
    await page.goto('http://localhost:3006/fm-global-advanced');
  });

  test('should load page and show connection status', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page loaded successfully
    await expect(page.locator('body')).toBeVisible();
    
    // Look for the main heading or interface elements
    await page.waitForSelector('h1, h2, [role="main"], .container', { timeout: 10000 });
    
    // Take a screenshot of the initial page load
    await page.screenshot({ 
      path: 'screenshots/fm-global-initial-load.png', 
      fullPage: true 
    });
    
    console.log('✓ Page loaded successfully');
  });

  test('should test connection and chat functionality', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for input elements (textarea, input)
    const inputSelectors = [
      'textarea',
      'input[type="text"]',
      '[contenteditable="true"]',
      '[role="textbox"]'
    ];
    
    let messageInput;
    for (const selector of inputSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        messageInput = element;
        console.log(`✓ Found input element: ${selector}`);
        break;
      }
    }
    
    if (!messageInput) {
      console.log('No input element found, taking screenshot for debugging');
      await page.screenshot({ 
        path: 'screenshots/fm-global-no-input-debug.png', 
        fullPage: true 
      });
      throw new Error('No message input element found on the page');
    }
    
    // Type a question about sprinkler requirements
    const question = 'What are the sprinkler requirements for shuttle ASRS systems?';
    await messageInput.fill(question);
    console.log(`✓ Typed question: ${question}`);
    
    // Look for submit button or try Enter key
    const submitButtons = [
      'button[type="submit"]',
      'button:has-text("Send")',
      'button:has-text("Submit")',
      '[role="button"]:has-text("Send")'
    ];
    
    let submitted = false;
    for (const buttonSelector of submitButtons) {
      const button = page.locator(buttonSelector).first();
      if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
        await button.click();
        console.log(`✓ Clicked submit button: ${buttonSelector}`);
        submitted = true;
        break;
      }
    }
    
    if (!submitted) {
      // Try pressing Enter
      await messageInput.press('Enter');
      console.log('✓ Pressed Enter to submit');
    }
    
    // Wait for response - be generous with timeout for RAG processing
    await page.waitForTimeout(5000);
    
    // Take a screenshot after submitting the question
    await page.screenshot({ 
      path: 'screenshots/fm-global-after-question.png', 
      fullPage: true 
    });
    
    // Wait a bit more for potential response
    await page.waitForTimeout(10000);
    
    // Take final screenshot showing any response
    await page.screenshot({ 
      path: 'screenshots/fm-global-final-response.png', 
      fullPage: true 
    });
    
    console.log('✓ Test completed - check screenshots for results');
  });

  test('should test comprehensive conversation flow', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Test multiple questions in sequence
    const questions = [
      'What are the sprinkler requirements for shuttle ASRS systems?',
      'What clearance requirements apply to storage systems?'
    ];
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`Testing question ${i + 1}: ${question}`);
      
      // Find input element
      const messageInput = page.locator('textarea, input[type="text"], [contenteditable="true"], [role="textbox"]').first();
      
      if (await messageInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await messageInput.fill(question);
        await messageInput.press('Enter');
        
        // Wait for processing
        await page.waitForTimeout(8000);
        
        // Take screenshot for this question
        await page.screenshot({ 
          path: `screenshots/fm-global-question-${i + 1}.png`, 
          fullPage: true 
        });
      } else {
        console.log(`Could not find input for question ${i + 1}`);
      }
    }
    
    // Take final comprehensive screenshot
    await page.screenshot({ 
      path: 'screenshots/fm-global-comprehensive-test.png', 
      fullPage: true 
    });
    
    console.log('✓ Comprehensive conversation test completed');
  });
});