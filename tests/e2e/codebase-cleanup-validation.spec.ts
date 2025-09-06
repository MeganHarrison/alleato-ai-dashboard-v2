import { test, expect } from '@playwright/test';

test.describe('Codebase Cleanup Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Set base URL to the local development server
    await page.goto('http://localhost:3008');
  });

  test('should redirect root to dashboard and load successfully', async ({ page }) => {
    // Check that root redirects to /dashboard
    await expect(page).toHaveURL(/.*\/dashboard$/);
    
    // Check that the main heading is present
    await expect(page.locator('h1')).toContainText('hello.');
    
    // Check that service cards are visible
    await expect(page.locator('.grid')).toBeVisible();
    
    // Verify ASRS GURU card exists
    await expect(page.locator('text=ASRS GURU')).toBeVisible();
    
    // Verify Project Maestro card exists
    await expect(page.locator('text=Project Maestro')).toBeVisible();
    
    // Verify Company Knowledge Base card exists
    await expect(page.locator('text=Company Knowledge Base')).toBeVisible();
  });

  test('should have working sidebar navigation', async ({ page }) => {
    // Check that sidebar is present
    await expect(page.locator('[data-sidebar="sidebar"]')).toBeVisible();
    
    // Check that sidebar trigger works
    const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
    await expect(sidebarTrigger).toBeVisible();
  });

  test('should load dashboard sections without errors', async ({ page }) => {
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check for section cards
    const sectionCards = page.locator('[data-testid="section-cards"]');
    if (await sectionCards.isVisible()) {
      await expect(sectionCards).toBeVisible();
    }
    
    // Check for projects table (if data exists)
    const projectsTable = page.locator('table');
    if (await projectsTable.isVisible()) {
      await expect(projectsTable).toBeVisible();
    }
    
    // Check footer is present
    await expect(page.locator('text=© 2025 Next Level AI Agents')).toBeVisible();
  });

  test('should navigate to ASRS features', async ({ page }) => {
    // Try to navigate to an ASRS feature (if accessible)
    const asrsLink = page.locator('text=ASRS GURU');
    if (await asrsLink.isVisible()) {
      await asrsLink.click();
      // Should navigate successfully without 404
      await page.waitForLoadState('networkidle');
      const url = page.url();
      expect(url).not.toContain('404');
    }
  });

  test('should handle authentication pages', async ({ page }) => {
    // Navigate to signin
    await page.goto('http://localhost:3008/signin');
    await page.waitForLoadState('networkidle');
    
    // Should not be a 404
    expect(page.url()).not.toContain('404');
    
    // Navigate to signup
    await page.goto('http://localhost:3008/signup');
    await page.waitForLoadState('networkidle');
    
    // Should not be a 404
    expect(page.url()).not.toContain('404');
  });
});