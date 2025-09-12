/**
 * @fileoverview Focused test for meetings action items functionality
 * Wait for loading and check actual meeting data
 */

import { test, expect } from '@playwright/test';

test.describe('Meetings Action Items - Focused Test', () => {
  test('should wait for meetings to load and check action items', async ({ page }) => {
    const consoleLogs: string[] = [];
    
    // Capture console logs for debugging
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log('🔍 Console:', text);
    });
    
    // Capture errors
    page.on('pageerror', (error) => {
      console.log('❌ Page Error:', error.message);
    });

    // Navigate to meetings page
    await page.goto('http://localhost:3002/meetings');
    
    // Wait for loading to complete - look for either meetings to appear or "no meetings" message
    try {
      await page.waitForFunction(
        () => {
          const loadingText = document.body.innerText;
          return !loadingText.includes('Loading meetings...');
        },
        { timeout: 10000 }
      );
      
      console.log('✅ Loading completed');
    } catch (error) {
      console.log('⚠️ Loading timeout, proceeding anyway');
    }

    // Take screenshot after loading
    await page.screenshot({ 
      path: 'screenshots/meetings-after-loading.png',
      fullPage: true 
    });

    // Check what's on the page now
    const pageContent = await page.textContent('body');
    console.log('📄 Page content includes:', 
      pageContent?.includes('meetings') ? 'meetings' : 'no meetings found',
      pageContent?.includes('action') ? 'action items' : 'no action items'
    );

    // Look for meeting links or cards
    const meetingElements = await page.locator('[href*="/meetings/"], .meeting-card, .meeting-item, [data-testid*="meeting"]').all();
    console.log(`📊 Found ${meetingElements.length} meeting elements`);

    if (meetingElements.length > 0) {
      console.log('✅ Found meetings, clicking on first one');
      
      // Get the href of the first meeting
      const firstMeetingHref = await meetingElements[0].getAttribute('href');
      console.log('🔗 First meeting href:', firstMeetingHref);
      
      // Click on first meeting
      await meetingElements[0].click();
      
      // Wait for meeting page to load
      await page.waitForTimeout(3000);
      
      // Check for debug logs about meeting data
      await page.waitForTimeout(2000);
      
      // Look for Actions tab
      const actionsTabs = await page.locator('text=Actions, [data-testid="actions-tab"], [role="tab"]:has-text("Actions")').all();
      
      if (actionsTabs.length > 0) {
        console.log('✅ Found Actions tab');
        await actionsTabs[0].click();
        await page.waitForTimeout(2000);
        
        // Take screenshot of actions tab
        await page.screenshot({ 
          path: 'screenshots/meeting-actions-tab.png',
          fullPage: true 
        });
        
        // Check for action items in various forms
        const actionItemsElements = await page.locator(
          '[data-testid="action-items"], .action-item, ul li, div:has-text("action")'
        ).all();
        
        console.log(`📋 Found ${actionItemsElements.length} potential action item elements`);
        
        // Check if there's actual action item content
        for (let i = 0; i < Math.min(actionItemsElements.length, 5); i++) {
          const text = await actionItemsElements[i].textContent();
          console.log(`📝 Action item ${i + 1}:`, text?.substring(0, 100));
        }
        
      } else {
        console.log('⚠️ No Actions tab found');
        
        // Look for any tab structure
        const allTabs = await page.locator('[role="tab"], .tab, .nav-tab').all();
        console.log(`🔍 Found ${allTabs.length} total tabs`);
        
        for (let i = 0; i < allTabs.length; i++) {
          const tabText = await allTabs[i].textContent();
          console.log(`📑 Tab ${i + 1}:`, tabText);
        }
      }
    } else {
      console.log('⚠️ No meetings found, checking if we can create test data');
      
      // Check if there's a message about no meetings
      const noMeetingsMessage = await page.locator('text="No meetings found", text="no meetings", .empty-state').first();
      if (await noMeetingsMessage.isVisible()) {
        console.log('📝 Confirmed: No meetings in database');
      }
      
      // Try to access a meeting directly with a known ID pattern
      const directMeetingUrl = 'http://localhost:3002/meetings/test-meeting-123';
      console.log(`🔗 Trying direct meeting URL: ${directMeetingUrl}`);
      
      await page.goto(directMeetingUrl);
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'screenshots/direct-meeting-attempt.png',
        fullPage: true 
      });
    }

    // Print all console logs that might be relevant
    console.log('\n📋 Relevant Console Logs:');
    consoleLogs.forEach((log, index) => {
      if (log.includes('Meeting') || log.includes('action') || log.includes('metadata') || log.includes('📄') || log.includes('Error')) {
        console.log(`${index + 1}: ${log}`);
      }
    });
  });

  test('should check the meetings page source code for debugging', async ({ page }) => {
    await page.goto('http://localhost:3002/meetings');
    await page.waitForTimeout(3000);
    
    // Get the HTML source to understand the structure
    const htmlContent = await page.content();
    
    // Look for key elements in the source
    const hasLoadingState = htmlContent.includes('Loading meetings');
    const hasMeetingComponents = htmlContent.includes('meeting');
    const hasActionItems = htmlContent.includes('action');
    
    console.log('📄 Page Source Analysis:');
    console.log('- Has loading state:', hasLoadingState);
    console.log('- Has meeting components:', hasMeetingComponents);
    console.log('- Has action items:', hasActionItems);
    
    // Look for React components
    const reactComponents = htmlContent.match(/data-testid="[^"]*"/g) || [];
    console.log('🔧 React test IDs found:', reactComponents.slice(0, 10));
    
    await page.screenshot({ 
      path: 'screenshots/meetings-page-analysis.png',
      fullPage: true 
    });
  });
});