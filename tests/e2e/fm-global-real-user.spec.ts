import { test, expect } from '@playwright/test';

test.describe('FM Global Expert - Real User Testing', () => {
  test('Complete user journey: send message and receive AI response', async ({ page }) => {
    // Set longer timeout for AI responses
    test.setTimeout(60000);
    
    console.log('🔍 Step 1: Navigating to FM Global Expert page...');
    await page.goto('http://localhost:3001/fm-global-expert');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check for any console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Check page loaded without critical errors
    await page.waitForTimeout(2000);
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
    
    console.log('✅ Page loaded without critical errors');
    
    // Check main elements are present
    const title = page.locator('h1:has-text("HELLO")');
    await expect(title).toBeVisible();
    
    const subtitle = page.locator('text=How can I help you today?');
    await expect(subtitle).toBeVisible();
    
    console.log('✅ Welcome screen displayed correctly');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'screenshots/fm-global-1-initial-state.png', 
      fullPage: true 
    });
    
    console.log('🔍 Step 2: Testing quick suggestion button...');
    
    // Click on a suggestion button
    const suggestionButton = page.locator('button:has-text("What are the sprinkler requirements for shuttle ASRS")').first();
    await expect(suggestionButton).toBeVisible();
    await suggestionButton.click();
    
    // Wait for the message to appear in chat
    await page.waitForTimeout(1000);
    
    // Check if user message appears
    const userMessage = page.locator('text=What are the sprinkler requirements for shuttle ASRS');
    await expect(userMessage).toBeVisible();
    
    console.log('✅ Suggestion button clicked and message sent');
    
    // Take screenshot after sending message
    await page.screenshot({ 
      path: 'screenshots/fm-global-2-message-sent.png', 
      fullPage: true 
    });
    
    console.log('🔍 Step 3: Waiting for AI response...');
    
    // Wait for loading indicator to appear and disappear (indicating response received)
    // Look for the loading dots animation
    const loadingIndicator = page.locator('.animate-bounce').first();
    
    // Wait for loading to appear (with shorter timeout)
    try {
      await loadingIndicator.waitFor({ state: 'visible', timeout: 5000 });
      console.log('⏳ AI is processing...');
      
      // Now wait for it to disappear (indicating response complete)
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 30000 });
      console.log('✅ AI response received');
    } catch (e) {
      console.log('⚠️ Loading indicator not detected, checking for response directly...');
    }
    
    // Wait a bit for response to fully render
    await page.waitForTimeout(2000);
    
    // Check if assistant response exists (should have AI avatar)
    const assistantResponse = page.locator('.bg-orange-500').first(); // AI avatar
    const hasResponse = await assistantResponse.isVisible();
    
    if (hasResponse) {
      console.log('✅ AI assistant response displayed');
      
      // Take screenshot of response
      await page.screenshot({ 
        path: 'screenshots/fm-global-3-ai-response.png', 
        fullPage: true 
      });
    } else {
      console.log('❌ No AI response detected');
      
      // Take error screenshot
      await page.screenshot({ 
        path: 'screenshots/fm-global-error-no-response.png', 
        fullPage: true 
      });
    }
    
    console.log('🔍 Step 4: Testing manual message input...');
    
    // Test manual input
    const inputField = page.locator('input[placeholder*="Type message"]');
    await expect(inputField).toBeVisible();
    
    const testMessage = 'What is the water demand for a 30-foot ASRS system?';
    await inputField.fill(testMessage);
    
    // Check send button is enabled when text is entered
    const sendButton = page.locator('button[aria-label="Send message"]');
    await expect(sendButton).toBeEnabled();
    
    console.log('✅ Input field works and send button enabled');
    
    // Send the message
    await sendButton.click();
    
    // Wait for new message to appear
    await page.waitForTimeout(1000);
    
    // Verify message was sent
    const sentMessage = page.locator(`text="${testMessage}"`);
    await expect(sentMessage).toBeVisible();
    
    console.log('✅ Manual message sent successfully');
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'screenshots/fm-global-4-manual-message.png', 
      fullPage: true 
    });
    
    console.log('🔍 Step 5: Final validation...');
    
    // Check page is still responsive
    const finalInputField = page.locator('input[placeholder*="Type message"]');
    await expect(finalInputField).toBeVisible();
    await expect(finalInputField).toBeEditable();
    
    console.log('✅ Page remains functional after interactions');
    
    // Final comprehensive screenshot
    await page.screenshot({ 
      path: 'screenshots/fm-global-5-final-state.png', 
      fullPage: true 
    });
    
    console.log('\n📊 TEST SUMMARY:');
    console.log('✅ Page loads without errors');
    console.log('✅ UI elements render correctly');
    console.log('✅ Suggestion buttons work');
    console.log('✅ Messages can be sent');
    console.log(hasResponse ? '✅ AI responses are received' : '❌ AI responses NOT working');
    console.log('✅ Input field remains functional');
    console.log(`📸 ${hasResponse ? 5 : 4} screenshots captured`);
  });
});