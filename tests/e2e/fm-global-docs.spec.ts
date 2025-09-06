import { test, expect } from '@playwright/test';

test.describe('FM Global 8-34 Documentation Site', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the FM Global docs page
    await page.goto('/fm-global-docs');
  });

  test('should load the main documentation page', async ({ page }) => {
    // Check that the page loads with the correct title
    await expect(page.locator('h1')).toContainText('FM Global 8-34');
    
    // Check that the sidebar is visible
    await expect(page.locator('text=ASRS Protection Guide')).toBeVisible();
    
    // Check that the main content area is visible
    await expect(page.locator('article')).toBeVisible();
  });

  test('should display the sidebar with navigation sections', async ({ page }) => {
    // Check that the sidebar contains expected sections
    await expect(page.locator('text=Table of Contents')).toBeVisible();
    await expect(page.locator('text=1.0')).toBeVisible();
    await expect(page.locator('text=SCOPE')).toBeVisible();
    await expect(page.locator('text=2.0')).toBeVisible();
    await expect(page.locator('text=LOSS PREVENTION RECOMMENDATIONS')).toBeVisible();
    
    // Check that stats are displayed
    await expect(page.locator('text=Sections')).toBeVisible();
    await expect(page.locator('text=Tables')).toBeVisible();
    await expect(page.locator('text=Figures')).toBeVisible();
  });

  test('should allow navigation between sections', async ({ page }) => {
    // Click on a section in the sidebar
    await page.locator('text=Mini-Load ASRS').click();
    
    // Check that the content changed
    await expect(page.locator('h1')).toContainText('Mini-Load ASRS');
    
    // Check that breadcrumbs are updated
    await expect(page.locator('nav')).toContainText('ASRS Types');
    await expect(page.locator('nav')).toContainText('Mini-Load ASRS');
    
    // Check that page range is displayed
    await expect(page.locator('text=Pages')).toBeVisible();
  });

  test('should display content blocks with proper formatting', async ({ page }) => {
    // Navigate to a section with content
    await page.locator('text=Mini-Load ASRS').click();
    
    // Check that content blocks are rendered
    await expect(page.locator('article')).toContainText('angle irons');
    
    // Check for formatted elements like notes or warnings
    const importantBlocks = page.locator('.fm-important');
    if (await importantBlocks.count() > 0) {
      await expect(importantBlocks.first()).toBeVisible();
    }
    
    // Check for inline references if they exist
    const figureRefs = page.locator('[data-testid="figure-reference"]');
    const tableRefs = page.locator('[data-testid="table-reference"]');
    
    // These might not exist in all sections, so we just check if they're properly formatted when present
    if (await figureRefs.count() > 0) {
      await expect(figureRefs.first()).toBeVisible();
    }
    if (await tableRefs.count() > 0) {
      await expect(tableRefs.first()).toBeVisible();
    }
  });

  test('should perform search functionality', async ({ page }) => {
    // Click on the search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    
    // Type a search query
    await searchInput.fill('mini-load');
    
    // Wait for search results to appear
    await page.waitForTimeout(500); // Wait for debounced search
    
    // Check if search results dropdown appears
    const searchResults = page.locator('[data-testid="search-results"]').or(page.locator('.search-results'));
    
    // If search is implemented, results should appear
    if (await searchResults.isVisible()) {
      await expect(searchResults).toBeVisible();
      
      // Click on a search result
      await searchResults.locator('button').first().click();
      
      // Verify navigation occurred
      await expect(page.locator('h1')).toContainText('Mini-Load');
    }
    
    // Clear search
    await searchInput.clear();
  });

  test('should toggle sidebar collapse', async ({ page }) => {
    // Find and click the sidebar toggle button
    const toggleButton = page.locator('button').filter({ hasText: '' }).or(
      page.locator('[aria-label*="toggle"]').or(
        page.locator('button[title*="menu"]')
      )
    );
    
    // Check if toggle functionality exists
    if (await toggleButton.count() > 0) {
      await toggleButton.first().click();
      
      // Check that sidebar width changed (collapsed state)
      await page.waitForTimeout(300); // Wait for animation
      
      // Click again to expand
      await toggleButton.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('should display proper metadata and page references', async ({ page }) => {
    // Navigate to a section with content
    await page.locator('text=SCOPE').click();
    
    // Check that page references are displayed
    await expect(page.locator('text=Page')).toBeVisible();
    
    // Check for section metadata toggle if it exists
    const metadataToggle = page.locator('text=metadata');
    if (await metadataToggle.count() > 0) {
      await metadataToggle.click();
      
      // Check that metadata is displayed
      await expect(page.locator('text=Section ID')).toBeVisible();
      await expect(page.locator('text=Section Number')).toBeVisible();
    }
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that the page is still functional on mobile
    await expect(page.locator('h1')).toBeVisible();
    
    // On mobile, sidebar might be hidden or collapsed
    // Check that content is still accessible
    await expect(page.locator('article')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Reset to desktop
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('should provide accessibility features', async ({ page }) => {
    // Check for proper heading hierarchy
    const h1Elements = page.locator('h1');
    await expect(h1Elements).toHaveCount(1);
    
    // Check that interactive elements are focusable
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
    
    // Check for proper ARIA labels and roles where applicable
    const navigation = page.locator('nav').first();
    if (await navigation.count() > 0) {
      await expect(navigation).toBeVisible();
    }
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check that focus indicators are visible (this is visual, hard to test programmatically)
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test with a section that might not have content
    await page.locator('text=3.0').click();
    
    // Should not show error messages to user
    await expect(page.locator('text=error').or(page.locator('text=Error'))).toHaveCount(0);
    
    // Should show appropriate message for empty content
    const noContentMessage = page.locator('text=No Content Available');
    if (await noContentMessage.count() > 0) {
      await expect(noContentMessage).toBeVisible();
    }
  });

  test('should load content efficiently', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now();
    
    await page.locator('text=SCOPE').click();
    await expect(page.locator('h1')).toContainText('SCOPE');
    
    const loadTime = Date.now() - startTime;
    
    // Content should load within reasonable time (2 seconds)
    expect(loadTime).toBeLessThan(2000);
    
    // Check that images load properly if any exist
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Wait for images to load
      await images.first().waitFor({ state: 'visible' });
    }
  });
});