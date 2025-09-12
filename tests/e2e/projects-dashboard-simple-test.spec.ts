import { test, expect } from '@playwright/test';

test.describe('Projects Dashboard - Simple Verification', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('CONSOLE ERROR:', msg.text());
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`);
      console.log('PAGE ERROR:', error.message);
    });
  });

  test('should load projects dashboard without critical errors', async ({ page }) => {
    // Navigate to the projects dashboard
    await page.goto('http://localhost:3009/projects-dashboard');
    
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Projects Dashboard');
    
    // Wait for React to render
    await page.waitForTimeout(3000);
    
    // Check for critical React errors (specifically the duplicate key error)
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Encountered two children with the same key') ||
      error.includes('unique "key" prop') ||
      error.includes('Assignment to constant variable') ||
      error.includes('Cannot read properties of undefined')
    );
    
    console.log('All console errors:', consoleErrors);
    console.log('Critical errors:', criticalErrors);
    
    // The main test - should have no critical React errors
    expect(criticalErrors).toHaveLength(0);
    
    // Verify main elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[role="tablist"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('should take screenshot showing dashboard works', async ({ page }) => {
    await page.goto('http://localhost:3009/projects-dashboard');
    await expect(page.locator('h1')).toContainText('Projects Dashboard');
    
    // Wait for everything to load
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({
      path: '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots/projects-dashboard-fixed.png',
      fullPage: true
    });
    
    // Verify no critical errors occurred during screenshot
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Warning:') && 
      !error.includes('DevTools') &&
      !error.includes('favicon') &&
      !error.includes('Failed to load resource') // Ignore missing static resources
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});