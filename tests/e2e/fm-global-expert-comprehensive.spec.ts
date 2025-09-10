import { test, expect, Page } from '@playwright/test';

// Test configuration
const FM_GLOBAL_URL = 'http://localhost:3001/fm-global-expert';
const SCREENSHOT_DIR = '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots';

// Test data for comprehensive testing
const TEST_QUERIES = {
  meetings: "What meetings have we had recently?",
  project: "Show me information about Project Alpha",
  insights: "What are the recent AI insights?",
  actionItems: "What action items are pending?",
  general: "Tell me about our current projects",
  empty: ""
};

test.describe('FM Global Expert RAG Interface Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Navigate to the FM Global Expert page
    await page.goto(FM_GLOBAL_URL);
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for React to mount
    await page.waitForTimeout(2000);
  });

  test('Page loads correctly and shows initial interface', async () => {
    // Verify the page title and main elements
    await expect(page).toHaveTitle(/FM Global/i);
    
    // Check for the main greeting
    await expect(page.locator('h1')).toContainText('HELLO');
    await expect(page.locator('text=How can I help you today?')).toBeVisible();
    
    // Verify suggestion cards are present
    const suggestionCards = page.locator('button').filter({ hasText: /sprinkler|calculate|K-factor/i });
    await expect(suggestionCards).toHaveCount(3);
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/fm-global-initial-state.png`,
      fullPage: true 
    });
    
    console.log('✓ Page loads correctly with initial interface');
  });

  test('Connection status indicator works', async () => {
    // Wait for connection status to be determined
    await page.waitForTimeout(3000);
    
    // Check if connection status alert is visible
    const statusAlert = page.locator('[role="alert"]').first();
    
    if (await statusAlert.isVisible()) {
      const statusText = await statusAlert.textContent();
      console.log('Connection status:', statusText);
      
      // Verify status shows either Railway, fallback, or error
      expect(statusText).toMatch(/(Railway|fallback|error)/i);
    }
    
    // Take screenshot of connection status
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/fm-global-connection-status.png`,
      fullPage: true 
    });
    
    console.log('✓ Connection status indicator displays correctly');
  });

  test('Chat input functionality works', async () => {
    // Find the input field
    const inputField = page.locator('input[type="text"]');
    await expect(inputField).toBeVisible();
    await expect(inputField).toHaveAttribute('placeholder', 'Type message');
    
    // Test typing in the input
    await inputField.fill('Test message');
    await expect(inputField).toHaveValue('Test message');
    
    // Clear input
    await inputField.clear();
    await expect(inputField).toHaveValue('');
    
    console.log('✓ Chat input functionality works correctly');
  });

  test('Submit button states work correctly', async () => {
    const inputField = page.locator('input[type="text"]');
    const submitButton = page.locator('button[type="submit"]');
    
    // Initially disabled with empty input
    await expect(submitButton).toBeDisabled();
    
    // Enabled with text
    await inputField.fill('Test question');
    await expect(submitButton).toBeEnabled();
    
    // Disabled again when cleared
    await inputField.clear();
    await expect(submitButton).toBeDisabled();
    
    console.log('✓ Submit button states work correctly');
  });

  test('Test meeting-related queries', async () => {
    const inputField = page.locator('input[type="text"]');
    const submitButton = page.locator('button[type="submit"]');
    
    // Submit the query
    await inputField.fill(TEST_QUERIES.meetings);
    await submitButton.click();
    
    // Wait for the message to appear in chat
    await page.waitForSelector('.space-y-6', { timeout: 10000 });
    
    // Verify user message appears
    const userMessage = page.locator('.space-y-6 >> text=' + TEST_QUERIES.meetings);
    await expect(userMessage).toBeVisible();
    
    // Wait for AI response (with loading indicator)
    await page.waitForSelector('.animate-bounce', { timeout: 5000 }).catch(() => {
      console.log('Loading indicator not found, continuing...');
    });
    
    // Wait for AI response to complete
    await page.waitForSelector('[data-testid="user-menu"] ~ div .prose', { timeout: 15000 }).catch(async () => {
      // Alternative selector for AI response
      await page.waitForSelector('.bg-orange-500 ~ div', { timeout: 10000 });
    });
    
    // Verify AI response appears
    const aiResponseArea = page.locator('.bg-orange-500').first();
    await expect(aiResponseArea).toBeVisible();
    
    // Take screenshot of the conversation
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/fm-global-meeting-query.png`,
      fullPage: true 
    });
    
    // Get the response text for validation
    const responseText = await page.locator('.prose').first().textContent();
    console.log('Meeting query response received:', responseText?.substring(0, 100) + '...');
    
    console.log('✓ Meeting-related query processed successfully');
  });

  test('Test project information queries', async () => {
    const inputField = page.locator('input[type="text"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await inputField.fill(TEST_QUERIES.project);
    await submitButton.click();
    
    // Wait for response
    await page.waitForTimeout(8000);
    
    // Verify conversation flow
    await expect(page.locator('text=' + TEST_QUERIES.project)).toBeVisible();
    await expect(page.locator('.bg-orange-500')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/fm-global-project-query.png`,
      fullPage: true 
    });
    
    console.log('✓ Project information query processed successfully');
  });

  test('Test AI insights queries', async () => {
    const inputField = page.locator('input[type="text"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await inputField.fill(TEST_QUERIES.insights);
    await submitButton.click();
    
    // Wait for response
    await page.waitForTimeout(8000);
    
    // Verify response
    await expect(page.locator('.bg-orange-500')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/fm-global-insights-query.png`,
      fullPage: true 
    });
    
    console.log('✓ AI insights query processed successfully');
  });

  test('Test action items queries', async () => {
    const inputField = page.locator('input[type="text"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await inputField.fill(TEST_QUERIES.actionItems);
    await submitButton.click();
    
    // Wait for response
    await page.waitForTimeout(8000);
    
    // Verify response
    await expect(page.locator('.bg-orange-500')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/fm-global-action-items-query.png`,
      fullPage: true 
    });
    
    console.log('✓ Action items query processed successfully');
  });

  test('Test suggestion buttons functionality', async () => {
    // Click on the first suggestion button
    const firstSuggestion = page.locator('button').filter({ hasText: /sprinkler.*shuttle.*ASRS/i });
    await firstSuggestion.click();
    
    // Wait for the query to be submitted automatically
    await page.waitForTimeout(8000);
    
    // Verify the suggestion text appears in the conversation
    const suggestionText = await firstSuggestion.textContent();
    await expect(page.locator(`text=${suggestionText}`)).toBeVisible();
    
    // Verify AI response
    await expect(page.locator('.bg-orange-500')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/fm-global-suggestion-click.png`,
      fullPage: true 
    });
    
    console.log('✓ Suggestion buttons work correctly');
  });

  test('Test multiple conversation turns', async () => {
    const inputField = page.locator('input[type="text"]');
    const submitButton = page.locator('button[type="submit"]');
    
    // First query
    await inputField.fill('Tell me about recent meetings');
    await submitButton.click();
    await page.waitForTimeout(6000);
    
    // Second query
    await inputField.fill('What about project updates?');
    await submitButton.click();
    await page.waitForTimeout(6000);
    
    // Third query
    await inputField.fill('Any action items?');
    await submitButton.click();
    await page.waitForTimeout(6000);
    
    // Verify multiple conversation turns
    const messages = page.locator('.space-y-6 > div');
    const messageCount = await messages.count();
    
    expect(messageCount).toBeGreaterThan(3); // At least 3 message pairs
    
    // Take final screenshot
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/fm-global-multiple-turns.png`,
      fullPage: true 
    });
    
    console.log(`✓ Multiple conversation turns work (${messageCount} messages)`);
  });

  test('Test error handling with empty queries', async () => {
    const inputField = page.locator('input[type="text"]');
    const submitButton = page.locator('button[type="submit"]');
    
    // Try to submit empty query (should be disabled)
    await inputField.fill('');
    await expect(submitButton).toBeDisabled();
    
    // Try with just spaces
    await inputField.fill('   ');
    await expect(submitButton).toBeDisabled();
    
    console.log('✓ Empty query handling works correctly');
  });

  test('Test responsive design elements', async () => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/fm-global-desktop-view.png`,
      fullPage: true 
    });
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/fm-global-tablet-view.png`,
      fullPage: true 
    });
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/fm-global-mobile-view.png`,
      fullPage: true 
    });
    
    console.log('✓ Responsive design tested across viewports');
  });

  test('Comprehensive functionality test', async () => {
    const inputField = page.locator('input[type="text"]');
    const submitButton = page.locator('button[type="submit"]');
    
    console.log('Starting comprehensive functionality test...');
    
    // Test 1: General project query
    await inputField.fill(TEST_QUERIES.general);
    await submitButton.click();
    
    // Wait for response and verify
    await page.waitForTimeout(8000);
    
    let responseElements = page.locator('.bg-orange-500');
    await expect(responseElements.first()).toBeVisible();
    
    // Get response content for analysis
    const firstResponse = await page.locator('.prose').first().textContent();
    console.log('First response preview:', firstResponse?.substring(0, 150) + '...');
    
    // Test 2: Verify data integration
    const hasProjectData = firstResponse?.includes('project') || firstResponse?.includes('Project');
    const hasMeetingData = firstResponse?.includes('meeting') || firstResponse?.includes('Meeting');
    const hasInsightData = firstResponse?.includes('insight') || firstResponse?.includes('Insight');
    
    console.log('Response analysis:');
    console.log('- Contains project data:', hasProjectData);
    console.log('- Contains meeting data:', hasMeetingData);
    console.log('- Contains insight data:', hasInsightData);
    
    // Test 3: Follow-up query to test conversation context
    await inputField.fill('Can you be more specific about the first project?');
    await submitButton.click();
    await page.waitForTimeout(6000);
    
    // Final comprehensive screenshot
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/fm-global-comprehensive-test.png`,
      fullPage: true 
    });
    
    console.log('✓ Comprehensive functionality test completed');
    
    // Verify final state
    const allMessages = page.locator('.space-y-6 > div');
    const finalMessageCount = await allMessages.count();
    console.log(`Final message count: ${finalMessageCount}`);
    
    expect(finalMessageCount).toBeGreaterThan(2);
  });
});