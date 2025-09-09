import { test, expect } from '@playwright/test';

test.describe('FM Global Status Indicator Test', () => {
  test('should capture the Railway/OpenAI fallback status indicator', async ({ page }) => {
    // Navigate to the FM Global Expert page on port 3009
    await page.goto('http://localhost:3009/fm-global-expert');
    
    // Wait for the page to fully load and the status check to complete
    await page.waitForLoadState('networkidle');
    
    // Wait for the loading state to complete and status to be determined
    // The connection check runs automatically on mount
    await page.waitForTimeout(3000);
    
    // Look for the alert component that shows connection status
    const statusAlert = page.locator('[data-testid="connection-status"], .alert, [role="alert"]').first();
    
    // If no specific alert found, look for the alert description text
    const alertDescription = page.locator('text=Railway unavailable, text=Connection check failed, text=Connected to Railway RAG, text=FM Global Expert Status').first();
    
    // Wait for either the alert or the status text to appear
    try {
      await expect(statusAlert.or(alertDescription)).toBeVisible({ timeout: 10000 });
      console.log('Status alert found');
    } catch (error) {
      console.log('Alert not found, looking for any status indicator...');
      
      // Look for any alert-like elements
      const anyAlert = page.locator('.border-green-500, .border-orange-500, .border-red-500, .bg-green-50, .bg-orange-50, .bg-red-50').first();
      await expect(anyAlert).toBeVisible({ timeout: 5000 });
    }
    
    // Take a full page screenshot to capture the status indicator
    await page.screenshot({ 
      path: 'screenshots/fm-global-status-indicator.png',
      fullPage: true
    });
    
    // Also log the page content to help debug what status is showing
    const pageContent = await page.content();
    const hasRailwayText = pageContent.includes('Railway');
    const hasOpenAIText = pageContent.includes('OpenAI') || pageContent.includes('fallback');
    const hasConnectionText = pageContent.includes('Connection') || pageContent.includes('Status');
    
    console.log('Page analysis:');
    console.log('- Contains Railway text:', hasRailwayText);
    console.log('- Contains OpenAI/fallback text:', hasOpenAIText); 
    console.log('- Contains connection/status text:', hasConnectionText);
    
    // Verify some status-related content is present
    expect(hasRailwayText || hasOpenAIText || hasConnectionText).toBeTruthy();
  });

  test('should verify the status alert shows connection information', async ({ page }) => {
    // Navigate to the FM Global Expert page
    await page.goto('http://localhost:3009/fm-global-expert');
    
    // Wait for network to be idle to ensure status check completes
    await page.waitForLoadState('networkidle');
    
    // Give time for the status check to complete
    await page.waitForTimeout(5000);
    
    // Check for specific status messages that should appear
    const possibleStatusMessages = [
      'Railway unavailable - Using OpenAI',
      'Connected to Railway RAG',
      'Connection check failed',
      'Using OpenAI fallback',
      'FM Global Expert Status'
    ];
    
    let foundStatus = false;
    for (const message of possibleStatusMessages) {
      try {
        await expect(page.locator(`text=${message}`)).toBeVisible({ timeout: 2000 });
        console.log(`Found status message: ${message}`);
        foundStatus = true;
        break;
      } catch (error) {
        // Continue checking other messages
      }
    }
    
    // If no specific message found, check for alert elements with status styling
    if (!foundStatus) {
      const alertElements = await page.locator('.border-green-500, .border-orange-500, .border-red-500').count();
      expect(alertElements).toBeGreaterThan(0);
      console.log(`Found ${alertElements} alert elements with status styling`);
    }
    
    // Take a focused screenshot of just the top area where the alert should be
    const topSection = page.locator('main, .flex-1').first();
    await topSection.screenshot({ 
      path: 'screenshots/fm-global-status-alert-focused.png'
    });
  });
});