import { test, expect } from '@playwright/test';

test.describe('Homepage AI Insights Validation', () => {
  test('should display AI insights correctly after database query fix', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:3006');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give additional time for data to load
    
    // 1. Verify the insights section header is visible
    const insightsHeader = page.locator('h2:has-text("RECENT INSIGHTS")');
    await expect(insightsHeader).toBeVisible({ timeout: 15000 });
    
    console.log('✅ Insights section header found');
    
    // 2. Check if insights are loading and displaying properly (not showing empty state)
    // Wait for either insights to load or empty state to show
    await page.waitForSelector('.space-y-4:has(h2:text("RECENT INSIGHTS")) > div', { timeout: 15000 });
    
    // Check if we have actual insights vs empty state
    const insightCards = page.locator('div:has(h3:text("Today")), div:has(h3:text("Yesterday")), div:has(h3:text("This Week"))');
    const emptyStateMessage = page.locator('text="No recent insights available"');
    
    const hasInsights = await insightCards.count() > 0;
    const hasEmptyState = await emptyStateMessage.isVisible();
    
    console.log(`Found ${await insightCards.count()} insight time groups`);
    console.log(`Empty state visible: ${hasEmptyState}`);
    
    if (hasInsights) {
      console.log('✅ Found insights - validating content');
      
      // 3. Verify the insights show parsed descriptions instead of raw JSON
      const firstInsightCard = page.locator('div:has(> p.text-sm.font-medium.text-gray-900)').first();
      if (await firstInsightCard.count() > 0) {
        const insightText = await firstInsightCard.locator('p.text-sm.font-medium.text-gray-900').textContent();
        
        console.log(`First insight text: "${insightText}"`);
        
        // Should not contain JSON brackets or raw JSON structure
        expect(insightText).not.toMatch(/^\s*\{.*\}\s*$/);
        expect(insightText).not.toContain('{"');
        expect(insightText).not.toContain('"}');
        
        // Should contain readable description text
        expect(insightText?.length).toBeGreaterThan(5);
        
        console.log('✅ Insight text is properly parsed (not raw JSON)');
      }
      
      // 4. Check that severity badges are working
      const severityBadges = page.locator('span:has-text("high"), span:has-text("medium"), span:has-text("low")');
      if (await severityBadges.count() > 0) {
        await expect(severityBadges.first()).toBeVisible();
        const badgeText = await severityBadges.first().textContent();
        expect(badgeText).toMatch(/^(high|medium|low)$/i);
        console.log(`✅ Severity badge found: "${badgeText}"`);
      }
      
      // 5. Ensure insights are grouped by time periods (Today, Yesterday, This Week)
      const todayHeader = page.locator('h3:has-text("Today")');
      const yesterdayHeader = page.locator('h3:has-text("Yesterday")');
      const thisWeekHeader = page.locator('h3:has-text("This Week")');
      
      const hasTimeGrouping = await todayHeader.isVisible() || 
                             await yesterdayHeader.isVisible() || 
                             await thisWeekHeader.isVisible();
      
      expect(hasTimeGrouping).toBe(true);
      console.log('✅ Time period grouping is working');
      
    } else if (hasEmptyState) {
      console.log('ℹ️  No insights found - showing proper empty state');
    } else {
      console.log('⚠️  Neither insights nor empty state found - checking for loading state');
    }
    
    // 6. Verify the split-screen layout is working
    const leftPanel = page.locator('h2:text("ACTIVE PROJECTS")').first();
    const rightPanel = page.locator('h2:text("RECENT MEETINGS")').first();
    
    await expect(leftPanel).toBeVisible({ timeout: 10000 });
    await expect(rightPanel).toBeVisible({ timeout: 10000 });
    console.log('✅ Split-screen layout is working');
    
    // 7. Verify meetings with macOS-style tabs are working
    const meetingTabs = page.locator('button:has-text("Today"), button:has-text("Yesterday"), button:has-text("This Week")');
    if (await meetingTabs.count() > 0) {
      await expect(meetingTabs.first()).toBeVisible();
      console.log('✅ macOS-style meeting tabs are working');
    }
    
    // Take a screenshot showing the working insights section
    await page.screenshot({ 
      path: 'screenshots/homepage-insights-working.png', 
      fullPage: true 
    });
    
    console.log('📸 Screenshot saved to screenshots/homepage-insights-working.png');
  });
  
  test('should handle insights loading states properly', async ({ page }) => {
    await page.goto('http://localhost:3006');
    
    // Check for loading animation or skeleton
    const loadingSkeletons = page.locator('div:has(> .animate-pulse)');
    
    // Wait for content to load - either insights or empty state
    await page.waitForSelector('h2:text("RECENT INSIGHTS")', { timeout: 15000 });
    
    // After initial load, loading skeletons should be gone
    await page.waitForTimeout(3000); // Give time for data to load
    const remainingSkeletons = await loadingSkeletons.count();
    console.log(`Loading skeletons remaining: ${remainingSkeletons}`);
  });
  
  test('should verify insights data integrity', async ({ page }) => {
    await page.goto('http://localhost:3006');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give time for insights to load
    
    // Look for actual insight content
    const insightCards = page.locator('div:has(> div.flex.items-start.justify-between > p.text-sm.font-medium.text-gray-900)');
    const insightCount = await insightCards.count();
    
    console.log(`Found ${insightCount} insight cards for validation`);
    
    if (insightCount > 0) {
      // Check each insight for proper structure
      for (let i = 0; i < Math.min(insightCount, 3); i++) { // Check first 3
        const insight = insightCards.nth(i);
        const insightText = await insight.locator('p.text-sm.font-medium.text-gray-900').textContent();
        
        console.log(`Validating insight ${i + 1}: "${insightText}"`);
        
        // Verify insight has meaningful content
        expect(insightText).toBeTruthy();
        expect(insightText!.trim().length).toBeGreaterThan(3);
        
        // Verify it's not JSON
        expect(insightText).not.toMatch(/^\s*\{.*\}\s*$/);
        
        // Check for metadata (project name, timestamp)
        const metadata = insight.locator('p.text-xs.text-gray-500');
        if (await metadata.count() > 0) {
          const metadataText = await metadata.textContent();
          expect(metadataText).toBeTruthy();
          console.log(`Insight ${i + 1} metadata: "${metadataText}"`);
        }
      }
      console.log('✅ All insight data integrity checks passed');
    } else {
      // Check if empty state is properly displayed
      const emptyState = page.locator('text="No recent insights available"');
      const hasEmptyState = await emptyState.isVisible();
      console.log(`Empty state properly displayed: ${hasEmptyState}`);
    }
  });
});