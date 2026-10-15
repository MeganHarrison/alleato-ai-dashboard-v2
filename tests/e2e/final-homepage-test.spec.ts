import { test, expect } from '@playwright/test';

test('Homepage displays meetings and insights data', async ({ page }) => {
  // Navigate to the correct port
  await page.goto('http://localhost:3001/');
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('\n=== Final Homepage Test ===\n');
  
  // Check for Dashboard text
  const dashboardText = await page.locator('text=Dashboard').count();
  console.log(`Dashboard text found: ${dashboardText > 0 ? '✅' : '❌'}`);
  
  // Check for meetings count indicator
  const meetingsIndicator = await page.locator('text=/\\d+ recent meetings/').count();
  if (meetingsIndicator > 0) {
    const meetingText = await page.locator('text=/\\d+ recent meetings/').first().textContent();
    console.log(`Meetings indicator: ✅ "${meetingText}"`);
  }
  
  // Check for active projects indicator
  const projectsIndicator = await page.locator('text=/\\d+ active projects/').count();
  if (projectsIndicator > 0) {
    const projectText = await page.locator('text=/\\d+ active projects/').first().textContent();
    console.log(`Projects indicator: ✅ "${projectText}"`);
  }
  
  // Check for meeting sections (Today, Yesterday, This Week)
  const todaySection = await page.locator('h3:has-text("Today")').count();
  const yesterdaySection = await page.locator('h3:has-text("Yesterday")').count();
  const thisWeekSection = await page.locator('h3:has-text("This Week")').count();
  
  console.log('\nMeeting Sections:');
  console.log(`- Today: ${todaySection > 0 ? '✅' : '❌'}`);
  console.log(`- Yesterday: ${yesterdaySection > 0 ? '✅' : '❌'}`);
  console.log(`- This Week: ${thisWeekSection > 0 ? '✅' : '❌'}`);
  
  // Check for specific meeting links
  const meetingLinks = await page.locator('a[href^="/meetings/"]').count();
  console.log(`\nMeeting links found: ${meetingLinks}`);
  
  if (meetingLinks > 0) {
    const firstMeeting = await page.locator('a[href^="/meetings/"]').first().textContent();
    console.log(`First meeting: "${firstMeeting?.trim()}"`);
  }
  
  // Check for insights
  const insightsSection = await page.locator('text=RECENT INSIGHTS').count();
  console.log(`\nInsights section: ${insightsSection > 0 ? '✅' : '❌'}`);
  
  // Check for insight severity badges
  const severityBadges = await page.locator('span').filter({ hasText: /high|medium|low|critical/i }).count();
  console.log(`Severity badges found: ${severityBadges}`);
  
  // Check for projects
  const projectCards = await page.locator('a[href^="/projects/"]').count();
  console.log(`\nProject cards found: ${projectCards}`);
  
  // Take screenshots
  await page.screenshot({ 
    path: 'screenshots/homepage-final-full.png',
    fullPage: true 
  });
  
  await page.screenshot({ 
    path: 'screenshots/homepage-final-viewport.png',
    fullPage: false 
  });
  
  console.log('\n📸 Screenshots saved:');
  console.log('- screenshots/homepage-final-full.png');
  console.log('- screenshots/homepage-final-viewport.png');
  
  // Final verification
  const hasData = meetingLinks > 0 || severityBadges > 0 || projectCards > 0;
  
  if (hasData) {
    console.log('\n✅ SUCCESS: Homepage is displaying data correctly!');
    console.log(`- ${meetingLinks} meetings displayed`);
    console.log(`- ${severityBadges} insights displayed`);
    console.log(`- ${projectCards} projects displayed`);
  } else {
    console.log('\n❌ FAILED: No data displayed on homepage');
  }
  
  expect(hasData).toBeTruthy();
});