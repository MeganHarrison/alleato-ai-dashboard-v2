const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testFMGlobalRAG() {
  console.log('🚀 Starting FM Global RAG System Test');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the FM Global advanced interface
    console.log('📍 Navigating to http://localhost:3003/fm-global-advanced');
    await page.goto('http://localhost:3003/fm-global-advanced');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Take screenshot of initial load
    await page.screenshot({ path: 'screenshots/test-1-initial-load.png', fullPage: true });
    console.log('✅ Initial page loaded - screenshot saved');
    
    // Check if we're on the login page or if the interface loaded
    const loginExists = await page.locator('text=Login').isVisible().catch(() => false);
    
    if (loginExists) {
      console.log('❌ Page redirected to login - authentication issue');
      await page.screenshot({ path: 'screenshots/test-2-login-redirect.png', fullPage: true });
      return false;
    }
    
    // Look for the FM Global interface elements
    const titleExists = await page.locator('h1:has-text("FM Global Advanced RAG")').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!titleExists) {
      console.log('❌ FM Global interface not found');
      await page.screenshot({ path: 'screenshots/test-3-no-interface.png', fullPage: true });
      return false;
    }
    
    console.log('✅ FM Global Advanced RAG interface found');
    
    // Look for input field
    const inputSelector = 'input[placeholder*="Ask complex questions"]';
    const inputExists = await page.locator(inputSelector).isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!inputExists) {
      console.log('❌ Input field not found');
      await page.screenshot({ path: 'screenshots/test-4-no-input.png', fullPage: true });
      return false;
    }
    
    console.log('✅ Input field found');
    
    // Type a test question
    const question = 'What are the sprinkler requirements for shuttle ASRS systems?';
    await page.fill(inputSelector, question);
    console.log(`✅ Typed question: ${question}`);
    
    // Submit the question
    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();
    console.log('✅ Question submitted');
    
    // Wait for the question to appear in chat
    await page.waitForSelector(`text=${question}`, { timeout: 10000 });
    console.log('✅ Question appeared in chat');
    
    // Take screenshot after submitting
    await page.screenshot({ path: 'screenshots/test-5-question-submitted.png', fullPage: true });
    
    // Wait for potential AI response (generous timeout)
    await page.waitForTimeout(15000);
    
    // Take final screenshot
    await page.screenshot({ path: 'screenshots/test-6-final-with-response.png', fullPage: true });
    
    // Check connection status
    const connectionStatus = await page.locator('text=Python Agent').textContent().catch(() => 'Not found');
    console.log(`🔗 Connection status: ${connectionStatus}`);
    
    console.log('✅ Test completed successfully - check screenshots for results');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/test-error.png', fullPage: true });
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testFMGlobalRAG().then(success => {
  if (success) {
    console.log('🎉 FM Global RAG system test completed successfully!');
    console.log('📸 Check the screenshots folder for visual evidence');
  } else {
    console.log('💥 FM Global RAG system test failed');
    console.log('📸 Check the screenshots folder for debugging information');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});