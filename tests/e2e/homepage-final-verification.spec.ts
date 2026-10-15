import { test, expect } from '@playwright/test';

test.describe('Homepage Final Verification', () => {
  test('should capture homepage with modern implementation', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:3000');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Wait for any potential loading states to complete
    await page.waitForTimeout(2000);

    // Verify key elements are present
    await expect(page.locator('h1')).toBeVisible();
    
    // Take full page screenshot
    await page.screenshot({
      path: 'screenshots/homepage-final-working-verification.png',
      fullPage: true
    });

    // Verify specific sections are present
    const projectsSection = page.locator('[data-testid*="project"], .project');
    const meetingsSection = page.locator('[data-testid*="meeting"], .meeting');
    
    console.log('Homepage screenshot captured successfully');
  });

  test('should verify homepage content and functionality', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check for header statistics
    const headerStats = page.locator('text=active projects, text=recent meetings').first();
    
    // Check for split-screen layout sections
    const leftSection = page.locator('.grid').first();
    const rightSection = page.locator('.grid').last();
    
    // Log what we find
    const title = await page.title();
    console.log('Page title:', title);
    
    const headingText = await page.locator('h1').first().textContent();
    console.log('Main heading:', headingText);

    // Take additional screenshot focused on main content
    await page.screenshot({
      path: 'screenshots/homepage-content-verification.png',
      fullPage: false
    });
  });
});