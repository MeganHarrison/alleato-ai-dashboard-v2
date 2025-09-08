import { chromium } from 'playwright';

async function finalVerification() {
  console.log('🎯 FINAL RAG SYSTEM VERIFICATION');
  console.log('='.repeat(40));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Load the page
    await page.goto('http://localhost:3001/fm-global-advanced');
    await page.waitForLoadState('networkidle');
    
    // Wait for streaming to complete and see full response
    console.log('   ⏳ Waiting 15 seconds for any streaming response to complete...');
    await page.waitForTimeout(15000);
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'screenshots/FINAL-COMPLETE-RAG-RESPONSE.png', 
      fullPage: true 
    });
    
    console.log('   ✅ Final complete screenshot saved!');
    
    // Try to test another question to show system capabilities
    const input = page.locator('input[placeholder*="Ask complex questions"]');
    await input.fill("What are FM Global's specific requirements for fire detection in high-bay warehouses with automated material handling equipment?");
    
    await page.getByRole('button', { name: 'Send' }).click();
    console.log('   🚀 Second test question sent');
    
    // Wait for second response
    await page.waitForTimeout(10000);
    
    await page.screenshot({ 
      path: 'screenshots/FINAL-SECOND-QUESTION.png', 
      fullPage: true 
    });
    
    console.log('   ✅ Second question screenshot saved!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

finalVerification().catch(console.error);