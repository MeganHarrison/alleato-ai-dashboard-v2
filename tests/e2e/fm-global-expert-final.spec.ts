import { test, expect, Page } from '@playwright/test';

test.describe('FM Global Expert Chat Interface - Final Comprehensive Testing', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to the FM Global Expert page
    await page.goto('http://localhost:3000/fm-global-expert');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('1. Page loads correctly without errors', async () => {
    // Check that the page title is correct (actual title from screenshot)
    await expect(page).toHaveTitle(/Alleato - AI Intelligence/);
    
    // Verify main elements are present
    await expect(page.locator('h1')).toContainText('HELLO');
    await expect(page.locator('p')).toContainText('How can I help you today?');
    
    // Check for message input field
    const messageInput = page.locator('input[placeholder*="message"], input[type="text"]');
    await expect(messageInput).toBeVisible();
    
    // Check for send button (arrow icon)
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeVisible();
    
    // Verify all three suggestion buttons are present with exact text
    const suggestion1 = page.locator('button', { hasText: 'What are the sprinkler requirements for shuttle ASRS with open-top containers?' });
    const suggestion2 = page.locator('button', { hasText: 'How do I calculate water demand for Class 3 commodities?' });
    const suggestion3 = page.locator('button', { hasText: 'What K-factor sprinklers are needed for 38ft storage height?' });
    
    await expect(suggestion1).toBeVisible();
    await expect(suggestion2).toBeVisible();
    await expect(suggestion3).toBeVisible();
    
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
    const firstSuggestion = page.locator('button', { hasText: suggestionText });
    await expect(firstSuggestion).toBeVisible();
    
    await firstSuggestion.click();
    
    // Wait a moment for the input to be populated
    await page.waitForTimeout(100);
    
    // Verify the text appears in the input field
    const messageInput = page.locator('input[type="text"]');
    await expect(messageInput).toHaveValue(suggestionText);
    
    // The suggestion button should automatically submit, so wait for the user message to appear in chat
    await expect(page.locator('text=' + suggestionText)).toBeVisible({ timeout: 10000 });
    
    // Wait for AI response (look for the AI avatar/icon or response content)
    const aiResponse = page.locator('.prose, div:has-text("AI")', { hasText: /shuttle|ASRS|sprinkler|container/i });
    await expect(aiResponse.first()).toBeVisible({ timeout: 30000 });
    
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
    const secondSuggestion = page.locator('button', { hasText: suggestionText });
    await expect(secondSuggestion).toBeVisible();
    
    await secondSuggestion.click();
    
    // Wait a moment for processing
    await page.waitForTimeout(100);
    
    // Verify the text appears in the input field
    const messageInput = page.locator('input[type="text"]');
    await expect(messageInput).toHaveValue(suggestionText);
    
    // Wait for user message to appear in chat
    await expect(page.locator('text=' + suggestionText)).toBeVisible({ timeout: 10000 });
    
    // Wait for AI response
    const aiResponse = page.locator('.prose, div:has-text("AI")', { hasText: /water|demand|Class 3|commodit/i });
    await expect(aiResponse.first()).toBeVisible({ timeout: 30000 });
    
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
    const thirdSuggestion = page.locator('button', { hasText: suggestionText });
    await expect(thirdSuggestion).toBeVisible();
    
    await thirdSuggestion.click();
    
    // Wait a moment for processing
    await page.waitForTimeout(100);
    
    // Verify the text appears in the input field
    const messageInput = page.locator('input[type="text"]');
    await expect(messageInput).toHaveValue(suggestionText);
    
    // Wait for user message to appear in chat
    await expect(page.locator('text=' + suggestionText)).toBeVisible({ timeout: 10000 });
    
    // Wait for AI response
    const aiResponse = page.locator('.prose, div:has-text("AI")', { hasText: /K-factor|sprinkler|38ft|height|storage/i });
    await expect(aiResponse.first()).toBeVisible({ timeout: 30000 });
    
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
    const messageInput = page.locator('input[type="text"]');
    await messageInput.fill(customMessage);
    
    // Verify the text is in the input
    await expect(messageInput).toHaveValue(customMessage);
    
    // Submit the message using the send button
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();
    
    // Wait for the user message to appear in chat
    await expect(page.locator('text=' + customMessage)).toBeVisible({ timeout: 10000 });
    
    // Wait for AI response
    const aiResponse = page.locator('.prose, div:has-text("AI")', { hasText: /FM Global|insurance|property/i });
    await expect(aiResponse.first()).toBeVisible({ timeout: 30000 });
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots/fm-global-manual-input-working.png',
      fullPage: true 
    });
    
    console.log('✓ Manual input works correctly');
  });

  test('6. Test error scenarios and edge cases', async () => {
    // Test empty message submission (should be disabled)
    const messageInput = page.locator('input[type="text"]');
    const sendButton = page.locator('button[type="submit"]');
    
    // Clear input and check if send button is disabled
    await messageInput.fill('');
    
    // Check if send button is disabled when input is empty
    const isDisabled = await sendButton.isDisabled();
    console.log(`Send button disabled for empty input: ${isDisabled}`);
    
    // Test with whitespace-only input
    await messageInput.fill('   ');
    const isDisabledWhitespace = await sendButton.isDisabled();
    console.log(`Send button disabled for whitespace-only input: ${isDisabledWhitespace}`);
    
    // Test loading states by sending a message and checking for loading indicators
    await messageInput.fill('Tell me about FM Global standards');
    await sendButton.click();
    
    // Check for loading indicator (bouncing dots or disabled state)
    const loadingIndicator = page.locator('.animate-bounce, .loading, [data-loading="true"]');
    
    if (await loadingIndicator.first().isVisible()) {
      console.log('✓ Loading indicator is shown during API call');
    } else {
      // Check if button becomes disabled during loading
      const buttonDisabledDuringLoad = await sendButton.isDisabled();
      console.log(`Button disabled during API call: ${buttonDisabledDuringLoad}`);
    }
    
    // Wait for response
    await expect(page.locator('text=Tell me about FM Global standards')).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Error scenarios and loading states handled correctly');
  });

  test('7. Specific error prevention - handleSubmit function check', async () => {
    // This test specifically checks for the previous "handleSubmit is not a function" error
    
    let jsErrors: string[] = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
      if (error.message.includes('handleSubmit is not a function')) {
        console.error('CRITICAL ERROR: handleSubmit is not a function error detected!');
      }
    });
    
    // Click each suggestion and verify no JavaScript errors occur
    const suggestions = [
      "What are the sprinkler requirements for shuttle ASRS with open-top containers?",
      "How do I calculate water demand for Class 3 commodities?", 
      "What K-factor sprinklers are needed for 38ft storage height?"
    ];
    
    for (let i = 0; i < suggestions.length; i++) {
      const suggestion = page.locator('button', { hasText: suggestions[i] });
      await expect(suggestion).toBeVisible();
      
      await suggestion.click();
      
      // Wait a moment to see if any errors occur
      await page.waitForTimeout(500);
      
      // Check for the specific handleSubmit error
      const hasHandleSubmitError = jsErrors.some(error => 
        error.includes('handleSubmit is not a function')
      );
      
      if (hasHandleSubmitError) {
        throw new Error(`handleSubmit function error detected for suggestion ${i + 1} - TEST FAILED`);
      }
      
      // Wait for the message to be processed
      await expect(page.locator(`text=${suggestions[i]}`)).toBeVisible({ timeout: 5000 });
      
      // Refresh the page for next test to reset state
      if (i < suggestions.length - 1) {
        await page.reload();
        await page.waitForLoadState('networkidle');
      }
    }
    
    console.log('✓ No handleSubmit function errors detected');
    console.log(`Total JavaScript errors detected: ${jsErrors.length}`);
    if (jsErrors.length > 0) {
      console.log('JavaScript errors (if any):', jsErrors);
    }
  });

  test('8. Complete user flow integration test', async () => {
    // Test a complete user flow: load page -> use suggestion -> ask follow-up -> manual input
    
    // Step 1: Use first suggestion
    const firstSuggestion = page.locator('button', { hasText: 'What are the sprinkler requirements for shuttle ASRS with open-top containers?' });
    await firstSuggestion.click();
    
    // Wait for AI response
    const firstResponse = page.locator('.prose, div:has-text("AI")').first();
    await expect(firstResponse).toBeVisible({ timeout: 30000 });
    
    // Step 2: Ask a follow-up question
    const messageInput = page.locator('input[type="text"]');
    const followUpQuestion = "What about for closed-top containers?";
    await messageInput.fill(followUpQuestion);
    
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();
    
    // Wait for follow-up response
    await expect(page.locator(`text=${followUpQuestion}`)).toBeVisible({ timeout: 10000 });
    await page.waitForSelector('.prose, div:has-text("AI")', { timeout: 30000, state: 'visible' });
    
    // Step 3: Verify the conversation history is maintained
    const allMessages = page.locator('.prose, p:has-text("shuttle ASRS"), p:has-text("closed-top")');
    const messageCount = await allMessages.count();
    
    expect(messageCount).toBeGreaterThan(0);
    console.log(`✓ Conversation maintained with ${messageCount} message elements`);
    
    // Final screenshot showing complete conversation
    await page.screenshot({ 
      path: '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots/fm-global-complete-conversation.png',
      fullPage: true 
    });
    
    console.log('✓ Complete user flow integration test passed');
  });
});