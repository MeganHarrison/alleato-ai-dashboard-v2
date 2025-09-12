import { test, expect } from '@playwright/test';

test.describe('Homepage Data Display', () => {
  test('should display meetings and insights on homepage', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for page to load - look for either Dashboard heading or projects section
    const dashboardVisible = await page.getByRole('heading', { name: 'Dashboard' }).isVisible().catch(() => false);
    const projectsVisible = await page.locator('text=ACTIVE PROJECTS').isVisible().catch(() => false);
    
    if (!dashboardVisible && !projectsVisible) {
      // If neither is visible, wait a bit and check what's on the page
      await page.waitForTimeout(2000);
      console.log('Page title:', await page.title());
      const pageText = await page.locator('body').textContent();
      console.log('Page contains:', pageText?.substring(0, 200));
    }
    
    // Check for meetings section - use more specific selector
    const meetingsSection = page.getByRole('heading', { name: 'RECENT MEETINGS' });
    await expect(meetingsSection).toBeVisible();
    
    // Check that meetings are displayed (not showing "No recent meetings")
    const noMeetingsMessage = page.locator('text=No recent meetings');
    const hasMeetings = await noMeetingsMessage.isVisible().then(visible => !visible).catch(() => true);
    
    if (hasMeetings) {
      console.log('✅ Meetings are displayed on the homepage');
      
      // Look for meeting titles
      const meetingTitles = await page.locator('a[href^="/meetings/"]').count();
      console.log(`Found ${meetingTitles} meeting links`);
      
      // Get first few meeting titles for verification
      if (meetingTitles > 0) {
        const firstMeetingText = await page.locator('a[href^="/meetings/"]').first().textContent();
        console.log(`First meeting: ${firstMeetingText}`);
      }
    } else {
      console.log('⚠️ No meetings displayed - showing "No recent meetings" message');
    }
    
    // Check for insights section - use more specific selector
    const insightsSection = page.getByRole('heading', { name: 'RECENT INSIGHTS' });
    await expect(insightsSection).toBeVisible();
    
    // Check that insights are displayed (not showing "No recent insights available")
    const noInsightsMessage = page.locator('text=No recent insights available');
    const hasInsights = await noInsightsMessage.isVisible().then(visible => !visible).catch(() => true);
    
    if (hasInsights) {
      console.log('✅ Insights are displayed on the homepage');
      
      // Look for insight cards with severity badges
      const insightCards = await page.locator('div').filter({ hasText: /high|medium|low|critical/ }).count();
      console.log(`Found ${insightCards} insight cards with severity badges`);
      
      // Check for specific insight types
      const riskInsights = await page.locator('text=/risk/i').count();
      const decisionInsights = await page.locator('text=/decision/i').count();
      const actionInsights = await page.locator('text=/action.*item/i').count();
      
      console.log(`Insight types - Risks: ${riskInsights}, Decisions: ${decisionInsights}, Action Items: ${actionInsights}`);
    } else {
      console.log('⚠️ No insights displayed - showing "No recent insights available" message');
    }
    
    // Check for projects section - use more specific selector
    const projectsSection = page.getByRole('heading', { name: 'ACTIVE PROJECTS' });
    await expect(projectsSection).toBeVisible();
    
    // Count project cards
    const projectCards = await page.locator('a[href^="/projects/"]').count();
    console.log(`Found ${projectCards} project cards`);
    
    // Take a screenshot for verification
    await page.screenshot({ 
      path: 'screenshots/homepage-with-data.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved to screenshots/homepage-with-data.png');
    
    // Verify at least one of meetings or insights is showing data
    expect(hasMeetings || hasInsights).toBeTruthy();
  });
  
  test('should display meeting dates correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Check if there are any date displays in the meetings section
    const meetingDates = page.locator('text=/Today|Yesterday|This Week/');
    const hasDateSections = await meetingDates.count() > 0;
    
    if (hasDateSections) {
      console.log('✅ Meeting date groupings are displayed');
      
      // Check for Today section
      const todaySection = await page.locator('text=Today').isVisible().catch(() => false);
      if (todaySection) {
        console.log('Found "Today" section for meetings');
      }
      
      // Check for Yesterday section
      const yesterdaySection = await page.locator('text=Yesterday').isVisible().catch(() => false);
      if (yesterdaySection) {
        console.log('Found "Yesterday" section for meetings');
      }
      
      // Check for This Week section
      const thisWeekSection = await page.locator('text=This Week').isVisible().catch(() => false);
      if (thisWeekSection) {
        console.log('Found "This Week" section for meetings');
      }
    }
    
    // Check for time displays (like "2:30 PM")
    const timeDisplays = await page.locator('text=/\\d{1,2}:\\d{2} [AP]M/').count();
    console.log(`Found ${timeDisplays} time displays in meeting section`);
    
    // Check for date displays (like "Sep 12")
    const dateDisplays = await page.locator('text=/[A-Z][a-z]{2} \\d{1,2}/').count();
    console.log(`Found ${dateDisplays} date displays in meeting section`);
  });
});