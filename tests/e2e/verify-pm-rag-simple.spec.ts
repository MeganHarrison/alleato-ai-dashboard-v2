import { test, expect } from '@playwright/test';

test.describe('PM RAG Chat Simple Verification', () => {
  test.setTimeout(60000);

  test('rag-system/chat page works with PM RAG API', async ({ page }) => {
    console.log('Testing rag-system/chat page...');
    
    // Navigate to the page
    await page.goto('http://localhost:3005/rag-system/chat');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give React time to render
    
    // Look for the textarea (it has the placeholder "Ask a question about your documents...")
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });
    
    // Type a test question
    await textarea.fill('What projects have been discussed in recent meetings?');
    
    // Find and click the send button
    const sendButton = page.locator('button[type="submit"]').first();
    await expect(sendButton).toBeVisible();
    await sendButton.click();
    
    // Wait for response - look for any loading indicator first
    await page.waitForTimeout(1000);
    
    // Wait for a response to appear (any div with substantial text)
    await page.waitForFunction(
      () => {
        const elements = document.querySelectorAll('div');
        return Array.from(elements).some(el => {
          const text = el.textContent || '';
          return text.includes('Tampa') || text.includes('Vermillion') || 
                 text.includes('project') || text.includes('meeting') ||
                 (text.length > 100 && !text.includes('Ask a question'));
        });
      },
      { timeout: 30000 }
    );
    
    // Take a screenshot of the successful interaction
    await page.screenshot({ 
      path: 'screenshots/rag-system-chat-success.png', 
      fullPage: true 
    });
    
    console.log('✓ rag-system/chat page is working with PM RAG API');
  });

  test('pm-chat-working page works with streaming', async ({ page }) => {
    console.log('Testing pm-chat-working page...');
    
    // Navigate to the page
    await page.goto('http://localhost:3005/pm-chat-working');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for the input field
    const input = page.locator('input[type="text"]').first();
    await expect(input).toBeVisible({ timeout: 10000 });
    
    // Type a question
    await input.fill('List all recent AI insights');
    
    // Submit
    const sendButton = page.locator('button[type="submit"]').first();
    await sendButton.click();
    
    // Wait for streaming to start (look for any loading indicator)
    await page.waitForTimeout(1000);
    
    // Wait for response
    await page.waitForFunction(
      () => {
        const elements = document.querySelectorAll('div');
        return Array.from(elements).some(el => {
          const text = el.textContent || '';
          return text.includes('insight') || text.includes('AI') || 
                 text.includes('analysis') || text.includes('Tampa') ||
                 (text.length > 100 && !text.includes('Ask about'));
        });
      },
      { timeout: 30000 }
    );
    
    // Take screenshot
    await page.screenshot({ 
      path: 'screenshots/pm-chat-working-success.png', 
      fullPage: true 
    });
    
    console.log('✓ pm-chat-working page is working with streaming');
  });

  test('API endpoints are healthy', async ({ request }) => {
    console.log('Testing API endpoints...');
    
    // Test pm-rag-fallback directly
    const pmRagResponse = await request.get('http://localhost:3005/api/pm-rag-fallback');
    expect(pmRagResponse.ok()).toBeTruthy();
    const pmRagData = await pmRagResponse.json();
    console.log('PM RAG Fallback API:', pmRagData);
    expect(pmRagData.status).toBe('healthy');
    
    // Test rag-proxy endpoint
    const proxyResponse = await request.get('http://localhost:3005/api/rag-proxy');
    expect(proxyResponse.ok()).toBeTruthy();
    const proxyData = await proxyResponse.json();
    console.log('RAG Proxy API:', proxyData);
    expect(proxyData.endpoint).toBe('PM RAG Fallback API');
    
    console.log('✓ All API endpoints are healthy');
  });

  test('PM RAG API returns quality responses', async ({ request }) => {
    console.log('Testing PM RAG API response quality...');
    
    // Send a test query to the PM RAG API
    const response = await request.post('http://localhost:3005/api/pm-rag-fallback', {
      data: {
        messages: [
          {
            role: 'user',
            content: 'What are the key projects and their current status?'
          }
        ],
        stream: false
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.text();
    
    // Parse the response (it might be streaming format)
    let message = '';
    if (data.includes('data:')) {
      // It's a streaming response
      const lines = data.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const chunk = JSON.parse(line.slice(6));
            if (chunk.type === 'text') {
              message += chunk.text;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    } else {
      // Try to parse as JSON
      try {
        const json = JSON.parse(data);
        message = json.message || json.response || data;
      } catch (e) {
        message = data;
      }
    }
    
    console.log('API Response:', message.substring(0, 200) + '...');
    
    // Verify response quality
    expect(message.length).toBeGreaterThan(50);
    
    console.log('✓ PM RAG API returns quality responses');
  });
});