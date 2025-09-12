/**
 * @fileoverview End-to-end tests for meeting pages action items functionality
 * Tests the display of action items from Fireflies metadata in meeting pages
 */

import { test, expect } from '@playwright/test';

test.describe('Meetings Action Items', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the meetings page
    await page.goto('http://localhost:3002/meetings');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display meetings list page', async ({ page }) => {
    // Check if the meetings page loads
    await expect(page).toHaveTitle(/Meetings/);
    
    // Take a screenshot of the meetings list
    await page.screenshot({ 
      path: 'screenshots/meetings-list.png',
      fullPage: true 
    });

    console.log('✅ Meetings list page screenshot saved');
  });

  test('should check for action items in individual meeting pages', async ({ page }) => {
    // Wait for any meetings to load
    await page.waitForTimeout(2000);
    
    // Look for meeting links or meeting items
    const meetingLinks = await page.locator('a[href*="/meetings/"]').all();
    
    if (meetingLinks.length > 0) {
      console.log(`Found ${meetingLinks.length} meeting links`);
      
      // Click on the first available meeting
      await meetingLinks[0].click();
      
      // Wait for the meeting page to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Look for the Actions tab
      const actionsTab = page.locator('text=Actions').or(page.locator('[data-testid="actions-tab"]'));
      
      if (await actionsTab.isVisible()) {
        console.log('✅ Actions tab found');
        await actionsTab.click();
        
        // Wait for action items to load
        await page.waitForTimeout(1000);
        
        // Take a screenshot of the actions section
        await page.screenshot({ 
          path: 'screenshots/meeting-action-items.png',
          fullPage: true 
        });
        
        console.log('✅ Meeting action items screenshot saved');
        
        // Check for action items content
        const actionItemsList = page.locator('[data-testid="action-items"]').or(
          page.locator('text=action').or(
            page.locator('ul li, div').filter({ hasText: /action|task|todo/i })
          )
        );
        
        if (await actionItemsList.first().isVisible()) {
          console.log('✅ Action items found in the UI');
        } else {
          console.log('⚠️ No action items visible in the Actions tab');
        }
      } else {
        console.log('⚠️ Actions tab not found');
        
        // Take a screenshot anyway to see what's available
        await page.screenshot({ 
          path: 'screenshots/meeting-page-no-actions-tab.png',
          fullPage: true 
        });
      }
    } else {
      console.log('⚠️ No meeting links found on the meetings page');
      
      // Try to access a meeting directly with a common ID pattern
      const testMeetingIds = [
        'clm123456789',
        'meeting-1',
        '1',
        'test-meeting',
        'sample-meeting'
      ];
      
      for (const meetingId of testMeetingIds) {
        try {
          await page.goto(`http://localhost:3002/meetings/${meetingId}`);
          await page.waitForTimeout(2000);
          
          // Check if we got a valid meeting page (not 404)
          const pageContent = await page.textContent('body');
          if (pageContent && !pageContent.includes('404') && !pageContent.includes('Not Found')) {
            console.log(`✅ Found valid meeting at ID: ${meetingId}`);
            
            // Look for Actions tab
            const actionsTab = page.locator('text=Actions').or(page.locator('[data-testid="actions-tab"]'));
            
            if (await actionsTab.isVisible()) {
              await actionsTab.click();
              await page.waitForTimeout(1000);
              
              await page.screenshot({ 
                path: `screenshots/meeting-${meetingId}-actions.png`,
                fullPage: true 
              });
              
              console.log(`✅ Screenshot saved for meeting ${meetingId}`);
            }
            
            break;
          }
        } catch (error) {
          console.log(`⚠️ Meeting ID ${meetingId} not accessible`);
        }
      }
    }
  });

  test('should check console logs for action items debug information', async ({ page }) => {
    const consoleLogs: string[] = [];
    
    // Capture console logs
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      
      // Log specific action items debug information
      if (text.includes('Meeting data loaded:') || 
          text.includes('action_items') || 
          text.includes('metadata') ||
          text.includes('📄')) {
        console.log('🔍 Console Debug:', text);
      }
    });
    
    // Capture errors
    page.on('pageerror', (error) => {
      console.log('❌ Page Error:', error.message);
    });
    
    // Navigate to meetings and check console
    await page.goto('http://localhost:3002/meetings');
    await page.waitForTimeout(3000);
    
    // Try to access first meeting
    const meetingLinks = await page.locator('a[href*="/meetings/"]').all();
    if (meetingLinks.length > 0) {
      await meetingLinks[0].click();
      await page.waitForTimeout(3000);
    }
    
    // Print all collected console logs at the end
    console.log('\n📋 All Console Logs:');
    consoleLogs.forEach((log, index) => {
      if (log.includes('action') || log.includes('metadata') || log.includes('Meeting')) {
        console.log(`${index + 1}: ${log}`);
      }
    });
  });

  test('should test database connection and meeting data', async ({ page }) => {
    // Go to a meeting page and check the network tab
    await page.goto('http://localhost:3002/meetings');
    
    // Monitor network requests
    page.on('response', response => {
      if (response.url().includes('api') || response.url().includes('meetings')) {
        console.log(`🌐 Network Response: ${response.status()} - ${response.url()}`);
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Try to access meeting data through any API endpoints or inspect what's loaded
    const meetingElements = await page.locator('[data-testid*="meeting"], .meeting-item, [href*="/meetings/"]').all();
    
    console.log(`📊 Found ${meetingElements.length} meeting-related elements`);
    
    if (meetingElements.length > 0) {
      // Take a screenshot showing the meeting elements
      await page.screenshot({ 
        path: 'screenshots/meeting-elements-found.png',
        fullPage: true 
      });
      
      console.log('✅ Meeting elements screenshot saved');
    }
  });
});