import { test, expect } from '@playwright/test';

test('Homepage Screenshots Test', async ({ page }) => {
  // Navigate to homepage
  console.log('Navigating to homepage...');
  await page.goto('http://localhost:3002');
  await page.waitForLoadState('networkidle');
  
  // Wait a moment for everything to settle
  await page.waitForTimeout(2000);
  
  // Take initial screenshot
  await page.screenshot({ 
    path: 'screenshots/homepage-full-page.png',
    fullPage: true 
  });
  console.log('Full page screenshot taken');

  // Check if we can see the projects count
  const projectCount = page.locator('text=/\\d+ of \\d+ projects/');
  if (await projectCount.isVisible()) {
    const countText = await projectCount.textContent();
    console.log('Project count found:', countText);
  } else {
    console.log('Project count not found');
  }

  // Try to click on cards tab specifically
  try {
    const cardsTab = page.locator('[role="tab"]').filter({ hasText: 'Cards' });
    if (await cardsTab.isVisible()) {
      await cardsTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'screenshots/homepage-cards-view.png',
        fullPage: true 
      });
      console.log('Cards view screenshot taken');
    }
  } catch (e) {
    console.log('Cards tab interaction failed:', e);
  }

  // Try to click on table tab
  try {
    const tableTab = page.locator('[role="tab"]').filter({ hasText: 'Table' });
    if (await tableTab.isVisible()) {
      await tableTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'screenshots/homepage-table-view.png',
        fullPage: true 
      });
      console.log('Table view screenshot taken');
    }
  } catch (e) {
    console.log('Table tab interaction failed:', e);
  }

  // Test search functionality
  try {
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Alleato');
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'screenshots/homepage-search-test.png',
        fullPage: true 
      });
      console.log('Search test screenshot taken');
      
      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
    }
  } catch (e) {
    console.log('Search functionality test failed:', e);
  }

  // Test current projects toggle
  try {
    const toggle = page.locator('input[type="checkbox"]', { has: page.locator('+ label:has-text("Current projects only")') });
    if (await toggle.isVisible()) {
      // Turn off current projects only to show all projects
      await toggle.uncheck();
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'screenshots/homepage-all-projects.png',
        fullPage: true 
      });
      console.log('All projects view screenshot taken');
    }
  } catch (e) {
    console.log('Toggle test failed:', e);
  }

  console.log('Homepage test completed');
});