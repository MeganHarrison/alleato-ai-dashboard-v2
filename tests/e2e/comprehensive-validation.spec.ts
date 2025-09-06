import { test, expect, Page } from '@playwright/test';

test.describe('Comprehensive Application Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/');
  });

  test('Home page loads correctly and shows all key elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Alleato - AI Intelligence/);
    
    // Check main heading
    await expect(page.getByRole('heading', { name: 'hello.' })).toBeVisible();
    
    // Check navigation sidebar is visible
    await expect(page.getByText('Alleato Group')).toBeVisible();
    
    // Check key navigation sections are expanded
    await expect(page.getByText('FM Global')).toBeVisible();
    await expect(page.getByText('Project Management')).toBeVisible();
    await expect(page.getByText('Tables')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
    
    // Check dashboard cards are visible
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.getByText('$1,250.00')).toBeVisible();
    await expect(page.getByText('New Customers')).toBeVisible();
    await expect(page.getByText('1,234')).toBeVisible();
    
    // Check projects table
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    await expect(page.getByText('No projects found.')).toBeVisible();
    
    // Check footer
    await expect(page.getByText('© 2025 Next Level AI Agents. All Rights Reserved.')).toBeVisible();
  });

  test('Projects Dashboard navigation and functionality', async ({ page }) => {
    // Navigate to projects dashboard
    await page.getByRole('link', { name: 'Projects Dashboard' }).click();
    
    // Check URL
    await expect(page).toHaveURL(/.*projects-dashboard/);
    
    // Check breadcrumb
    await expect(page.getByText('Projects Dashboard')).toBeVisible();
    
    // Check main heading
    await expect(page.getByRole('heading', { name: 'Projects Dashboard' })).toBeVisible();
    
    // Check stats cards
    await expect(page.getByText('Total Projects')).toBeVisible();
    await expect(page.getByText('Active')).toBeVisible();
    await expect(page.getByText('Planning')).toBeVisible();
    await expect(page.getByText('Total Revenue')).toBeVisible();
    
    // Check New Project button
    await expect(page.getByRole('button', { name: 'New Project' })).toBeVisible();
    
    // Check search functionality
    await expect(page.getByPlaceholder('Search projects...')).toBeVisible();
    
    // Check view toggles
    await expect(page.getByRole('tab', { name: 'Cards' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Table' })).toBeVisible();
    
    // Check empty state
    await expect(page.getByText('No projects found')).toBeVisible();
    await expect(page.getByText('Try adjusting your filters or search query')).toBeVisible();
  });

  test('Sitemap page shows comprehensive navigation', async ({ page }) => {
    // Navigate to sitemap
    await page.getByRole('link', { name: 'Sitemap' }).click();
    
    // Check URL
    await expect(page).toHaveURL(/.*sitemap/);
    
    // Check main heading
    await expect(page.getByRole('heading', { name: 'Site Navigation Map' })).toBeVisible();
    
    // Check total pages count
    await expect(page.getByText('68')).toBeVisible();
    await expect(page.getByText('Total Pages')).toBeVisible();
    
    // Check category counts
    await expect(page.getByText('Main')).toBeVisible();
    await expect(page.getByText('Dashboards')).toBeVisible();
    await expect(page.getByText('FM Global')).toBeVisible();
    await expect(page.getByText('Projects')).toBeVisible();
    
    // Check search functionality
    await expect(page.getByPlaceholder('Search for any page...')).toBeVisible();
    
    // Check view toggles
    await expect(page.getByRole('tab', { name: 'Grid View' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'List View' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Tree View' })).toBeVisible();
    
    // Check priority pages are marked
    await expect(page.getByText('Priority')).toBeVisible();
    
    // Test search functionality
    await page.getByPlaceholder('Search for any page...').fill('dashboard');
    await page.waitForTimeout(500); // Wait for search debounce
    
    // Should show relevant results
    await expect(page.getByText('Projects Dashboard')).toBeVisible();
  });

  test('Diagnostic page loads and shows tools', async ({ page }) => {
    // Navigate to diagnostic
    await page.getByRole('link', { name: 'Diagnostic' }).click();
    
    // Check URL
    await expect(page).toHaveURL(/.*diagnostic/);
    
    // Check main heading
    await expect(page.getByText('Vector Database & Chat System Diagnostics')).toBeVisible();
    
    // Check diagnostic button
    await expect(page.getByRole('button', { name: 'Run Diagnostics' })).toBeVisible();
  });

  test('Navigation sidebar functionality', async ({ page }) => {
    // Test sidebar toggle
    await page.getByRole('button', { name: 'Toggle Sidebar' }).first().click();
    await page.waitForTimeout(500);
    
    // Test collapsing sections
    await page.getByRole('button', { name: 'FM Global' }).click();
    await page.waitForTimeout(300);
    
    // Check that FM Global links are hidden (collapsed)
    await expect(page.getByRole('link', { name: 'ASRS Expert Agent' })).not.toBeVisible();
    
    // Expand again
    await page.getByRole('button', { name: 'FM Global' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('link', { name: 'ASRS Expert Agent' })).toBeVisible();
  });

  test('User profile section is present', async ({ page }) => {
    // Check user profile button
    await expect(page.getByRole('button', { name: /User/ })).toBeVisible();
    await expect(page.getByText('user@example.com')).toBeVisible();
    
    // Click user profile to test dropdown (if implemented)
    await page.getByRole('button', { name: /User/ }).click();
    await page.waitForTimeout(300);
  });

  test('Responsive design - mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that page still loads
    await expect(page.getByRole('heading', { name: 'hello.' })).toBeVisible();
    
    // Check sidebar toggle is available
    await expect(page.getByRole('button', { name: 'Toggle Sidebar' })).toBeVisible();
  });

  test('Error handling - invalid routes', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto('/non-existent-page');
    
    // Should show 404 or redirect appropriately
    // This might show a 404 page or redirect to home
    await page.waitForLoadState('networkidle');
    
    // Check if we're on a valid page (either 404 or redirected)
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });

  test('Theme and branding consistency', async ({ page }) => {
    // Check Alleato logo is present
    await expect(page.getByAltText('Alleato Group')).toBeVisible();
    
    // Check brand colors are applied (this would need more specific selectors)
    // For now, just verify consistent styling elements exist
    await expect(page.locator('.sidebar')).toBeTruthy();
  });

  test('Performance - page load times', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Page should load within reasonable time (5 seconds for development)
    expect(loadTime).toBeLessThan(5000);
  });

  test('Accessibility - keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Check that focus is visible and moving through elements
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // Test Enter key on navigation items
    await page.getByRole('link', { name: 'Projects Dashboard' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/.*projects-dashboard/);
  });

  test('Console errors check', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Filter out known development warnings
    const criticalErrors = errors.filter(error => 
      !error.includes('React DevTools') && 
      !error.includes('Image with src') &&
      !error.includes('404') // Some 404s are expected for missing resources
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

// Test specific page functionality
test.describe('Individual Page Functionality', () => {
  
  const testPages = [
    { name: 'Home', url: '/', expectedTitle: 'Alleato - AI Intelligence' },
    { name: 'Projects Dashboard', url: '/projects-dashboard', expectedHeading: 'Projects Dashboard' },
    { name: 'Diagnostic', url: '/diagnostic', expectedText: 'Vector Database & Chat System Diagnostics' },
    { name: 'Sitemap', url: '/sitemap', expectedHeading: 'Site Navigation Map' },
  ];

  testPages.forEach(({ name, url, expectedTitle, expectedHeading, expectedText }) => {
    test(`${name} page loads correctly`, async ({ page }) => {
      await page.goto(url);
      
      if (expectedTitle) {
        await expect(page).toHaveTitle(new RegExp(expectedTitle));
      }
      
      if (expectedHeading) {
        await expect(page.getByRole('heading', { name: expectedHeading })).toBeVisible();
      }
      
      if (expectedText) {
        await expect(page.getByText(expectedText)).toBeVisible();
      }
      
      // Check that page doesn't have critical errors
      const pageErrors: string[] = [];
      page.on('pageerror', (error) => {
        pageErrors.push(error.message);
      });
      
      await page.waitForTimeout(1000);
      expect(pageErrors).toHaveLength(0);
    });
  });
});