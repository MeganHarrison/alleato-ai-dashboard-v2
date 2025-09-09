import { test, expect } from '@playwright/test';

/**
 * Test to check what projects are available and their IDs
 * to understand which project ID we should use for testing.
 */

test('Check available projects and their IDs', async ({ page }) => {
  console.log('🔍 Checking available projects...');

  // Navigate to projects dashboard
  console.log('📍 Navigating to projects dashboard');
  await page.goto('http://localhost:4000/projects-dashboard');
  await page.waitForTimeout(3000);

  await page.screenshot({
    path: 'screenshots/projects-dashboard-check.png',
    fullPage: true
  });
  console.log('📸 Projects dashboard screenshot taken');

  // Look for project cards or table rows
  const projectElements = page.locator('[data-testid="project-card"], .project-card, tr[data-project-id], tbody tr');
  const projectCount = await projectElements.count();
  console.log(`📊 Found ${projectCount} potential project elements`);

  // Try to extract project IDs from various possible sources
  const projectLinks = page.locator('a[href*="/projects/"]');
  const linkCount = await projectLinks.count();
  console.log(`🔗 Found ${linkCount} project links`);

  if (linkCount > 0) {
    console.log('📋 Project links found:');
    for (let i = 0; i < Math.min(linkCount, 10); i++) {
      const href = await projectLinks.nth(i).getAttribute('href');
      console.log(`  - ${href}`);
    }
  }

  // Also check for any text that might contain project IDs
  const projectIdTexts = page.locator('text=/Project [0-9]+/i, text=/ID[: ]*[0-9]+/i');
  const idTextCount = await projectIdTexts.count();
  console.log(`🆔 Found ${idTextCount} elements with ID-like text`);

  if (idTextCount > 0 && idTextCount < 20) {
    const idTexts = await projectIdTexts.allTextContents();
    console.log('📋 ID-like texts:', idTexts);
  }

  // Try navigating to different project IDs to see which ones exist
  const testIds = [1, 2, 3, 4, 5, 60, 100];
  console.log('🧪 Testing project IDs:', testIds.join(', '));

  for (const id of testIds) {
    try {
      console.log(`🔍 Testing project ID ${id}...`);
      const response = await page.goto(`http://localhost:4000/projects/${id}`, {
        waitUntil: 'domcontentloaded',
        timeout: 5000
      });
      
      await page.waitForTimeout(1000);
      
      const pageTitle = await page.title();
      const hasError = await page.locator('text=Something went wrong, text=404, text=Not Found').count() > 0;
      
      console.log(`  - Project ${id}: ${hasError ? '❌ Error/404' : '✅ Loaded'} (Title: "${pageTitle}")`);
      
      if (!hasError) {
        // Found a working project! Take a screenshot
        await page.screenshot({
          path: `screenshots/project-${id}-found.png`,
          fullPage: true
        });
        console.log(`📸 Screenshot of working project ${id} taken`);
        break;
      }
    } catch (error) {
      console.log(`  - Project ${id}: ❌ Failed to load (${error.message.substring(0, 50)}...)`);
    }
  }

  console.log('✅ Project availability check completed');
});