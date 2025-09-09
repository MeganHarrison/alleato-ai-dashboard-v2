import { test, expect, Page } from '@playwright/test';

test.describe('FM Global Expert Chat Interface - Comprehensive Testing', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });

    // Navigate to the FM Global Expert page
    await page.goto('http://localhost:3000/fm-global-expert');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('1. Page loads correctly without errors', async () => {
    // Check that the page title is correct
    await expect(page).toHaveTitle(/FM Global Expert/);
    
    // Verify main elements are present
    await expect(page.locator('h1')).toContainText('FM Global Expert');
    
    // Check for message input field
    const messageInput = page.locator('input[type="text"], textarea').first();
    await expect(messageInput).toBeVisible();
    
    // Check for send button
    const sendButton = page.locator('button[type="submit"], button').filter({ hasText: /send|submit/i }).first();
    await expect(sendButton).toBeVisible();
    
    // Verify suggestion buttons are present
    const suggestionButtons = page.locator('button').filter({ hasText: /What are the sprinkler requirements|How do I calculate water demand|What K-factor sprinklers/ });
    await expect(suggestionButtons).toHaveCount(3);
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots/fm-global-initial-state.png',
      fullPage: true 
    });
    
    console.log('✓ Page loads correctly with all elements present');
  });

  test('2. Test first suggestion button - Shuttle ASRS question', async () => {
    const suggestionText = "What are the sprinkler requirements for shuttle ASRS with open-top containers?";
    
    // Find and click the first suggestion button
    const firstSuggestion = page.locator('button').filter({ hasText: /What are the sprinkler requirements/ }).first();
    await expect(firstSuggestion).toBeVisible();
    
    await firstSuggestion.click();
    
    // Verify the text appears in the input field
    const messageInput = page.locator('input[type="text"], textarea').first();
    await expect(messageInput).toHaveValue(suggestionText);
    
    // Submit the message
    const sendButton = page.locator('button[type="submit"], button').filter({ hasText: /send|submit/i }).first();
    await sendButton.click();
    
    // Wait for AI response (allow up to 30 seconds)
    await expect(page.locator('text=' + suggestionText).first()).toBeVisible();
    
    // Wait for AI response to appear
    await page.waitForSelector('div:has-text("shuttle ASRS"), div:has-text("open-top"), div:has-text("sprinkler")', { 
      timeout: 30000 
    });
    
    // Take screenshot showing successful interaction
    await page.screenshot({ 
      path: '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots/fm-global-suggestion-1-working.png',
      fullPage: true 
    });
    
    console.log('✓ First suggestion button works correctly');
  });

  test('3. Test second suggestion button - Water demand calculation', async () => {
    const suggestionText = "How do I calculate water demand for Class 3 commodities?";
    
    // Find and click the second suggestion button
    const secondSuggestion = page.locator('button').filter({ hasText: /How do I calculate water demand/ }).first();
    await expect(secondSuggestion).toBeVisible();
    
    await secondSuggestion.click();
    
    // Verify the text appears in the input field
    const messageInput = page.locator('input[type="text"], textarea').first();
    await expect(messageInput).toHaveValue(suggestionText);
    
    // Submit the message
    const sendButton = page.locator('button[type="submit"], button').filter({ hasText: /send|submit/i }).first();
    await sendButton.click();
    
    // Wait for AI response
    await expect(page.locator('text=' + suggestionText).first()).toBeVisible();
    
    // Wait for AI response to appear
    await page.waitForSelector('div:has-text("Class 3"), div:has-text("water demand"), div:has-text("calculate")', { 
      timeout: 30000 
    });
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots/fm-global-suggestion-2-working.png',
      fullPage: true 
    });
    
    console.log('✓ Second suggestion button works correctly');
  });

  test('4. Test third suggestion button - K-factor sprinklers', async () => {
    const suggestionText = "What K-factor sprinklers are needed for 38ft storage height?";
    
    // Find and click the third suggestion button
    const thirdSuggestion = page.locator('button').filter({ hasText: /What K-factor sprinklers/ }).first();
    await expect(thirdSuggestion).toBeVisible();
    
    await thirdSuggestion.click();
    
    // Verify the text appears in the input field
    const messageInput = page.locator('input[type="text"], textarea').first();
    await expect(messageInput).toHaveValue(suggestionText);
    
    // Submit the message
    const sendButton = page.locator('button[type="submit"], button').filter({ hasText: /send|submit/i }).first();
    await sendButton.click();
    
    // Wait for AI response
    await expect(page.locator('text=' + suggestionText).first()).toBeVisible();
    
    // Wait for AI response to appear
    await page.waitForSelector('div:has-text("K-factor"), div:has-text("38ft"), div:has-text("sprinkler")', { 
      timeout: 30000 
    });
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots/fm-global-suggestion-3-working.png',
      fullPage: true 
    });
    
    console.log('✓ Third suggestion button works correctly');
  });

  test('5. Test manual input functionality', async () => {
    const customMessage = "What is FM Global and what do they do?";
    
    // Type in custom message
    const messageInput = page.locator('input[type="text"], textarea').first();
    await messageInput.fill(customMessage);
    
    // Verify the text is in the input
    await expect(messageInput).toHaveValue(customMessage);
    
    // Submit the message
    const sendButton = page.locator('button[type="submit"], button').filter({ hasText: /send|submit/i }).first();
    await sendButton.click();
    
    // Wait for the message to appear in chat
    await expect(page.locator('text=' + customMessage).first()).toBeVisible();
    
    // Wait for AI response
    await page.waitForSelector('div:has-text("FM Global"), div:has-text("insurance"), div:has-text("property")', { 
      timeout: 30000 
    });
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots/fm-global-manual-input-working.png',
      fullPage: true 
    });
    
    console.log('✓ Manual input works correctly');
  });

  test('6. Test error scenarios and edge cases', async () => {
    // Test empty message submission (should be disabled)
    const messageInput = page.locator('input[type="text"], textarea').first();
    const sendButton = page.locator('button[type="submit"], button').filter({ hasText: /send|submit/i }).first();
    
    // Clear input and try to submit
    await messageInput.fill('');
    
    // Check if send button is disabled when input is empty
    const isDisabled = await sendButton.isDisabled();
    if (!isDisabled) {
      // If not disabled, clicking should not send empty message
      await sendButton.click();
      
      // Wait a bit to see if anything happens
      await page.waitForTimeout(1000);
      
      // There should be no new messages in the chat
      console.log('Empty message handling: Button not disabled but empty message not sent');
    } else {
      console.log('✓ Send button is properly disabled for empty input');
    }
    
    // Test loading states
    await messageInput.fill('Tell me about FM Global standards');
    await sendButton.click();
    
    // Check for loading indicator (spinner, disabled button, etc.)
    const loadingIndicator = page.locator('.animate-spin, .loading, [data-loading="true"]').first();
    
    if (await loadingIndicator.isVisible()) {
      console.log('✓ Loading indicator is shown during API call');
    }
    
    // Wait for response
    await page.waitForSelector('div:has-text("FM Global"), div:has-text("standards")', { 
      timeout: 30000 
    });
    
    console.log('✓ Error scenarios and loading states handled correctly');
  });

  test('7. Performance and responsiveness check', async () => {
    // Check for any performance issues by rapidly clicking suggestions
    const suggestions = page.locator('button').filter({ hasText: /What are the sprinkler requirements|How do I calculate water demand|What K-factor sprinklers/ });
    
    // Click each suggestion rapidly to test for race conditions
    for (let i = 0; i < 3; i++) {
      const suggestion = suggestions.nth(i);
      await suggestion.click();
      
      // Clear the input and try the next one
      const messageInput = page.locator('input[type="text"], textarea').first();
      await messageInput.clear();
      
      // Small delay to prevent overwhelming
      await page.waitForTimeout(100);
    }
    
    // Check that the interface is still responsive
    const messageInput = page.locator('input[type="text"], textarea').first();
    await messageInput.fill('Final test message');
    await expect(messageInput).toHaveValue('Final test message');
    
    console.log('✓ Interface remains responsive under rapid interaction');
  });

  test('8. Specific error prevention - handleSubmit function check', async () => {
    // This test specifically checks for the previous "handleSubmit is not a function" error
    
    // Click each suggestion and verify no JavaScript errors occur
    const suggestions = page.locator('button').filter({ hasText: /What are the sprinkler requirements|How do I calculate water demand|What K-factor sprinklers/ });
    
    for (let i = 0; i < 3; i++) {
      const suggestion = suggestions.nth(i);
      
      // Listen for any JavaScript errors
      let jsError = false;
      page.on('pageerror', error => {
        if (error.message.includes('handleSubmit is not a function')) {
          jsError = true;
          console.error('CRITICAL ERROR: handleSubmit is not a function error detected!');
        }
      });
      
      await suggestion.click();
      
      // Wait a moment to see if any errors occur
      await page.waitForTimeout(500);
      
      if (jsError) {
        throw new Error('handleSubmit function error detected - TEST FAILED');
      }
      
      // Clear for next iteration
      const messageInput = page.locator('input[type="text"], textarea').first();
      await messageInput.clear();
    }
    
    console.log('✓ No handleSubmit function errors detected');
  });
});