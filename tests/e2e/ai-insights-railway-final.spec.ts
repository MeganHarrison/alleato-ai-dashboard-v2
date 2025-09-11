import { test, expect } from '@playwright/test';

test('AI Insights Chat - Railway PM RAG Integration', async ({ page }) => {
  console.log('🚀 Testing AI Insights Chat with Railway PM RAG endpoint...');
  
  // Navigate to the AI insights page
  await page.goto('http://localhost:3004/ai-insights-page');
  await page.waitForLoadState('networkidle');
  
  // Scroll down to find the chat interface (it's at the bottom of the page)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  
  // Look for the PM RAG Assistant card
  const chatCard = page.locator('text=PM RAG Assistant').first();
  await expect(chatCard).toBeVisible({ timeout: 5000 });
  console.log('✅ Found PM RAG Assistant chat interface');
  
  // Check for online status (health check)
  await page.waitForTimeout(2000); // Give time for health check
  const onlineIndicator = page.locator('text=Online');
  const isOnline = await onlineIndicator.isVisible().catch(() => false);
  
  if (isOnline) {
    console.log('✅ Chat is ONLINE and connected to Railway endpoint');
  } else {
    const connectionIssue = await page.locator('text=Connection Issue').isVisible().catch(() => false);
    if (connectionIssue) {
      console.log('❌ Connection Issue detected - Railway endpoint may be down');
    } else {
      console.log('⚠️ Health status unknown - still checking...');
    }
  }
  
  // Find the chat input
  const chatInput = page.locator('input[placeholder*="Ask about your projects"]').first();
  await expect(chatInput).toBeVisible();
  console.log('✅ Chat input field is visible');
  
  // Type a test message
  const testMessage = 'What are the key insights from recent project meetings?';
  await chatInput.fill(testMessage);
  console.log(`📝 Typed test message: "${testMessage}"`);
  
  // Find and click send button
  const sendButton = page.locator('button[type="submit"]').last();
  await sendButton.click();
  console.log('📤 Message sent to Railway PM RAG endpoint');
  
  // Wait for response
  console.log('⏳ Waiting for response from Railway endpoint...');
  
  // Look for streaming or processing indicator
  const processingText = page.locator('text=/Processing|Streaming/i');
  const isProcessing = await processingText.isVisible({ timeout: 2000 }).catch(() => false);
  
  if (isProcessing) {
    console.log('🔄 Response is streaming/processing...');
    await page.waitForTimeout(5000); // Wait for response to complete
  }
  
  // Check for response
  const responseMessages = page.locator('div[class*="bg-muted"]');
  const responseCount = await responseMessages.count();
  
  if (responseCount > 0) {
    const lastResponse = responseMessages.last();
    const responseText = await lastResponse.textContent();
    console.log('✅ Received response from Railway PM RAG:');
    console.log('   ', responseText?.substring(0, 150) + '...');
    
    // Check for metadata (sources, confidence)
    const hasSources = await page.locator('text=Sources:').isVisible().catch(() => false);
    const hasConfidence = await page.locator('text=Confidence:').isVisible().catch(() => false);
    
    if (hasSources) console.log('✅ Response includes source citations');
    if (hasConfidence) console.log('✅ Response includes confidence score');
  } else {
    // Check for error messages
    const errorAlert = page.locator('[role="alert"], .alert');
    const hasError = await errorAlert.isVisible().catch(() => false);
    
    if (hasError) {
      const errorText = await errorAlert.textContent();
      console.log('❌ Error received:', errorText);
    } else {
      console.log('⚠️ No response received - check Railway endpoint logs');
    }
  }
  
  // Take final screenshot
  await page.screenshot({ 
    path: 'screenshots/ai-insights-railway-integration.png',
    fullPage: true 
  });
  console.log('📸 Screenshot saved to screenshots/ai-insights-railway-integration.png');
  
  // Verify we're using the Railway endpoint
  const networkLogs: string[] = [];
  page.on('request', request => {
    if (request.url().includes('railway.app')) {
      networkLogs.push(`Railway request: ${request.url()}`);
    }
  });
  
  // Make another quick request to capture network activity
  await chatInput.fill('Test');
  await page.waitForTimeout(1000);
  
  if (networkLogs.length > 0) {
    console.log('✅ Confirmed using Railway endpoint:');
    networkLogs.forEach(log => console.log('   ', log));
  }
  
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`Chat Interface: ✅ Visible`);
  console.log(`Railway Endpoint: ${isOnline ? '✅ Connected' : '⚠️ Check connection'}`);
  console.log(`Chat Functionality: ${responseCount > 0 ? '✅ Working' : '⚠️ Check response'}`);
  console.log(`Endpoint URL: ${process.env.RAILWAY_PM_RAG || 'Environment variable not set'}`);
});