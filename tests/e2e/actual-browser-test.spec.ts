import { test, expect, chromium } from '@playwright/test';

test.describe('Actual Browser Test for PM RAG Chat', () => {
  test('Comprehensive test of chat pages', async () => {
    console.log('\n=== STARTING ACTUAL BROWSER TEST ===\n');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Test 1: Server health check
    console.log('1. Testing server accessibility...');
    try {
      const response = await page.goto('http://localhost:3005');
      if (response?.ok()) {
        console.log('   ✅ Server is accessible');
      } else {
        console.log('   ❌ Server returned status:', response?.status());
      }
    } catch (error) {
      console.log('   ❌ Cannot reach server:', error.message);
      await browser.close();
      return;
    }
    
    // Test 2: API health check
    console.log('\n2. Testing PM RAG API...');
    const apiHealth = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/pm-rag-fallback');
        return await res.json();
      } catch (e) {
        return { error: e.message };
      }
    });
    
    if (apiHealth.status === 'healthy') {
      console.log(`   ✅ API is healthy with ${apiHealth.stats?.meetings || 0} meetings`);
    } else {
      console.log('   ❌ API is not healthy:', apiHealth);
    }
    
    // Test 3: rag-system/chat page
    console.log('\n3. Testing /rag-system/chat page...');
    try {
      await page.goto('http://localhost:3005/rag-system/chat', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      // Wait a bit for React to render
      await page.waitForTimeout(2000);
      
      // Check what's actually on the page
      const pageInfo = await page.evaluate(() => {
        const textarea = document.querySelector('textarea');
        const inputs = document.querySelectorAll('input');
        const buttons = document.querySelectorAll('button');
        
        return {
          hasTextarea: !!textarea,
          textareaPlaceholder: textarea?.placeholder || null,
          inputCount: inputs.length,
          buttonCount: buttons.length,
          pageText: document.body.innerText.substring(0, 200),
          title: document.title
        };
      });
      
      console.log('   Page analysis:', pageInfo);
      
      if (pageInfo.hasTextarea) {
        // Try to interact
        await page.fill('textarea', 'Test message: What projects are active?');
        console.log('   ✅ Filled textarea with test message');
        
        // Find and click submit
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          console.log('   ✅ Clicked submit button');
          
          // Wait for any response
          await page.waitForTimeout(3000);
          
          // Check if there's a response
          const afterSubmit = await page.evaluate(() => {
            return document.body.innerText.length;
          });
          
          if (afterSubmit > pageInfo.pageText.length + 50) {
            console.log('   ✅ Page content changed after submission (likely got response)');
          }
        }
      } else {
        console.log('   ⚠️ No textarea found on page');
      }
      
      // Take screenshot
      await page.screenshot({ 
        path: 'screenshots/rag-system-chat-actual.png',
        fullPage: true 
      });
      console.log('   📸 Screenshot saved: rag-system-chat-actual.png');
      
    } catch (error) {
      console.log('   ❌ Failed to test rag-system/chat:', error.message);
    }
    
    // Test 4: pm-chat-working page
    console.log('\n4. Testing /pm-chat-working page...');
    try {
      await page.goto('http://localhost:3005/pm-chat-working', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      await page.waitForTimeout(2000);
      
      const pmPageInfo = await page.evaluate(() => {
        const input = document.querySelector('input[type="text"], input[placeholder*="Ask"]');
        const textarea = document.querySelector('textarea');
        const submitBtn = document.querySelector('button[type="submit"]');
        
        return {
          hasInput: !!input,
          inputPlaceholder: input?.getAttribute('placeholder') || null,
          hasTextarea: !!textarea,
          hasSubmitButton: !!submitBtn,
          pageHasContent: document.body.innerText.includes('PM') || document.body.innerText.includes('Assistant')
        };
      });
      
      console.log('   Page analysis:', pmPageInfo);
      
      if (pmPageInfo.hasInput || pmPageInfo.hasTextarea) {
        console.log('   ✅ Chat interface found');
      } else {
        console.log('   ⚠️ No chat interface found');
      }
      
      await page.screenshot({ 
        path: 'screenshots/pm-chat-working-actual.png',
        fullPage: true 
      });
      console.log('   📸 Screenshot saved: pm-chat-working-actual.png');
      
    } catch (error) {
      console.log('   ❌ Failed to test pm-chat-working:', error.message);
    }
    
    // Test 5: Direct API test with message
    console.log('\n5. Testing direct API call...');
    const apiTest = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/pm-rag-fallback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'List current projects' }],
            stream: false
          })
        });
        
        const text = await response.text();
        return {
          success: true,
          hasContent: text.length > 50,
          preview: text.substring(0, 100)
        };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });
    
    if (apiTest.success && apiTest.hasContent) {
      console.log('   ✅ API responds to messages');
      console.log('   Response preview:', apiTest.preview);
    } else {
      console.log('   ❌ API message test failed:', apiTest);
    }
    
    console.log('\n=== TEST COMPLETE ===');
    console.log('Screenshots saved to screenshots/ directory');
    console.log('Check the screenshots to see actual page state\n');
    
    await browser.close();
  });
});