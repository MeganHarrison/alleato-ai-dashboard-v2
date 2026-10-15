import { test, expect } from '@playwright/test';

test('homepage loads and shows expected content', async ({ page }) => {
  // Navigate to homepage
  await page.goto('http://localhost:3002');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Check if page loads without errors
  await expect(page).toHaveTitle(/Alleato - AI Intelligence/);

  // Check if active projects section is showing
  await expect(page.locator('h2:has-text("ACTIVE PROJECTS")')).toBeVisible();
  
  // Check if recent meetings section is showing
  await expect(page.locator('h2:has-text("RECENT MEETINGS")')).toBeVisible();
  const noRecentMeetingsText = page.locator('text=No recent meetings');
  const hasMeetings = await noRecentMeetingsText.count() === 0;
  
  // Check if recent insights section is showing
  await expect(page.locator('h2:has-text("RECENT INSIGHTS")')).toBeVisible();
  const noRecentInsightsText = page.locator('text=No recent insights');
  const hasInsights = await noRecentInsightsText.count() === 0;

  // Take screenshot
  await page.screenshot({ 
    path: '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots/homepage-working-test.png',
    fullPage: true 
  });

  // Log results
  console.log('Homepage test results:');
  console.log('- Page loads: ✓');
  console.log('- Active Projects section: ✓');
  console.log(`- Meetings showing data: ${hasMeetings ? '✓' : '❌'}`);
  console.log(`- Insights showing data: ${hasInsights ? '✓' : '❌'}`);
});