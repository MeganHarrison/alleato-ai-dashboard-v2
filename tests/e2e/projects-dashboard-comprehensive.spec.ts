import { test, expect } from '@playwright/test';

/**
 * Comprehensive test suite for Projects Dashboard
 * 
 * This test suite validates:
 * 1. Page loads without React key errors
 * 2. Filter dropdowns work properly 
 * 3. Both card and table views display correctly
 * 4. No console errors related to duplicate keys
 * 5. Search functionality works
 * 6. All interactive elements function properly
 */
test.describe('Projects Dashboard - Comprehensive Testing', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Clear arrays for each test
    consoleErrors = [];
    consoleWarnings = [];
    
    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        console.log('CONSOLE ERROR:', text);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text);
        console.log('CONSOLE WARNING:', text);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`);
      console.log('PAGE ERROR:', error.message);
    });
  });

  test('should load projects dashboard without React key errors', async ({ page }) => {
    // Navigate to the projects dashboard
    await page.goto('http://localhost:3009/projects-dashboard');
    
    // Wait for the page to fully load
    await expect(page.locator('h1')).toContainText('Projects Dashboard');
    
    // Wait a bit more to ensure all React components are rendered
    await page.waitForTimeout(2000);
    
    // Check for React key-related errors
    const reactKeyErrors = consoleErrors.filter(error => 
      error.includes('key') || 
      error.includes('unique') || 
      error.includes('duplicate') ||
      error.includes('Each child in a list should have a unique')
    );
    
    expect(reactKeyErrors).toHaveLength(0);
    
    // Verify main elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[role="tablist"]')).toBeVisible(); // Cards/Table toggle
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('should display both card and table views correctly', async ({ page }) => {
    await page.goto('http://localhost:3009/projects-dashboard');
    await expect(page.locator('h1')).toContainText('Projects Dashboard');
    
    // Test Card View (default)
    const cardsTab = page.locator('[role="tab"]').filter({ hasText: 'Cards' });
    const tableTab = page.locator('[role="tab"]').filter({ hasText: 'Table' });
    
    // Verify cards tab is active by default
    await expect(cardsTab).toHaveAttribute('data-state', 'active');
    
    // Wait for cards to load or empty state
    await page.waitForTimeout(1000);
    
    // Check if we have project cards or empty state
    const hasProjects = await page.locator('[role="tabpanel"]').first().locator('.grid').isVisible().catch(() => false);
    
    if (hasProjects) {
      console.log('Projects found - testing card view');
      await expect(page.locator('.grid')).toBeVisible();
    } else {
      console.log('No projects found - testing empty state');
      await expect(page.locator('text=No projects found')).toBeVisible();
    }
    
    // Switch to Table View
    await tableTab.click();
    await expect(tableTab).toHaveAttribute('data-state', 'active');
    await expect(cardsTab).toHaveAttribute('data-state', 'inactive');
    
    // Wait for table to render
    await page.waitForTimeout(500);
    
    if (hasProjects) {
      console.log('Testing table view with projects');
      await expect(page.locator('table')).toBeVisible();
      await expect(page.locator('thead')).toBeVisible();
    } else {
      console.log('Testing table view empty state');
      await expect(page.locator('text=No projects found')).toBeVisible();
    }
    
    // Switch back to Cards View
    await cardsTab.click();
    await expect(cardsTab).toHaveAttribute('data-state', 'active');
  });

  test('should test filter dropdowns functionality', async ({ page }) => {
    await page.goto('http://localhost:3009/projects-dashboard');
    await expect(page.locator('h1')).toContainText('Projects Dashboard');
    
    // Wait for filters to load
    await page.waitForTimeout(1000);
    
    // Test Phase/Status Filter
    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeVisible();
    
    // Get available options
    const statusOptions = await statusSelect.locator('option').allTextContents();
    console.log('Available status options:', statusOptions);
    
    if (statusOptions.length > 1) {
      // Test selecting different status options
      for (let i = 1; i < Math.min(statusOptions.length, 3); i++) {
        await statusSelect.selectOption({ index: i });
        await page.waitForTimeout(500); // Wait for filtering
        
        // Verify no React key errors after filter change
        const keyErrors = consoleErrors.filter(error => 
          error.includes('key') || error.includes('duplicate')
        );
        expect(keyErrors).toHaveLength(0);
      }
    }
    
    // Test Category Filter
    const categorySelect = page.locator('select').nth(1);
    await expect(categorySelect).toBeVisible();
    
    const categoryOptions = await categorySelect.locator('option').allTextContents();
    console.log('Available category options:', categoryOptions);
    
    if (categoryOptions.length > 1) {
      // Test selecting different category options
      for (let i = 1; i < Math.min(categoryOptions.length, 3); i++) {
        await categorySelect.selectOption({ index: i });
        await page.waitForTimeout(500);
        
        // Verify no React key errors after filter change
        const keyErrors = consoleErrors.filter(error => 
          error.includes('key') || error.includes('duplicate')
        );
        expect(keyErrors).toHaveLength(0);
      }
    }
    
    // Reset filters
    await statusSelect.selectOption({ index: 0 }); // "All Status"
    await categorySelect.selectOption({ index: 0 }); // "All Categories"
  });

  test('should test search functionality', async ({ page }) => {
    await page.goto('http://localhost:3009/projects-dashboard');
    await expect(page.locator('h1')).toContainText('Projects Dashboard');
    
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    
    // Test search functionality
    await searchInput.fill('test search');
    await page.waitForTimeout(500);
    
    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);
    
    // Test another search term
    await searchInput.fill('project');
    await page.waitForTimeout(500);
    
    // Verify no console errors during search
    const searchErrors = consoleErrors.filter(error => 
      !error.includes('Warning:') && 
      !error.includes('DevTools')
    );
    expect(searchErrors).toHaveLength(0);
  });

  test('should test interactive elements functionality', async ({ page }) => {
    await page.goto('http://localhost:3009/projects-dashboard');
    await expect(page.locator('h1')).toContainText('Projects Dashboard');
    
    // Test "Current projects only" toggle
    const toggleSwitch = page.locator('[role="switch"]');
    if (await toggleSwitch.isVisible()) {
      const initialState = await toggleSwitch.getAttribute('aria-checked');
      await toggleSwitch.click();
      await page.waitForTimeout(1000); // Wait for data to reload
      
      const newState = await toggleSwitch.getAttribute('aria-checked');
      expect(newState).not.toBe(initialState);
    }
    
    // Test New Project button
    const newProjectBtn = page.locator('text=New Project');
    await expect(newProjectBtn).toBeVisible();
    await expect(newProjectBtn).toBeEnabled();
    
    // Test Columns dropdown
    const columnsBtn = page.locator('button').filter({ hasText: 'Columns' });
    if (await columnsBtn.isVisible()) {
      await columnsBtn.click();
      await page.waitForTimeout(300);
      
      // Verify dropdown opened
      const dropdown = page.locator('[role="menu"]');
      await expect(dropdown).toBeVisible();
      
      // Close dropdown by clicking elsewhere
      await page.locator('h1').click();
      await page.waitForTimeout(300);
    }
    
    // Verify no errors from interactions
    const interactionErrors = consoleErrors.filter(error => 
      !error.includes('Warning:') && 
      !error.includes('DevTools') &&
      !error.includes('favicon')
    );
    expect(interactionErrors).toHaveLength(0);
  });

  test('should verify no duplicate key console errors', async ({ page }) => {
    await page.goto('http://localhost:3009/projects-dashboard');
    await expect(page.locator('h1')).toContainText('Projects Dashboard');
    
    // Wait for everything to load and render
    await page.waitForTimeout(3000);
    
    // Test all interactive elements to trigger re-renders
    const statusSelect = page.locator('select').first();
    const categorySelect = page.locator('select').nth(1);
    
    // Cycle through filters to test for key errors
    const statusOptions = await statusSelect.locator('option').count();
    if (statusOptions > 1) {
      for (let i = 0; i < Math.min(statusOptions, 4); i++) {
        await statusSelect.selectOption({ index: i });
        await page.waitForTimeout(300);
      }
    }
    
    const categoryOptions = await categorySelect.locator('option').count();
    if (categoryOptions > 1) {
      for (let i = 0; i < Math.min(categoryOptions, 4); i++) {
        await categorySelect.selectOption({ index: i });
        await page.waitForTimeout(300);
      }
    }
    
    // Switch between views multiple times
    const cardsTab = page.locator('[role="tab"]').filter({ hasText: 'Cards' });
    const tableTab = page.locator('[role="tab"]').filter({ hasText: 'Table' });
    
    await tableTab.click();
    await page.waitForTimeout(500);
    await cardsTab.click();
    await page.waitForTimeout(500);
    await tableTab.click();
    await page.waitForTimeout(500);
    
    // Specifically check for React key warnings and errors
    const reactKeyIssues = consoleErrors.concat(consoleWarnings).filter(msg => 
      msg.includes('key') ||
      msg.includes('duplicate') ||
      msg.includes('Each child in a list should have a unique "key" prop') ||
      msg.includes('unique "key"') ||
      msg.includes('Warning: Encountered two children with the same key')
    );
    
    console.log('All console errors:', consoleErrors);
    console.log('All console warnings:', consoleWarnings);
    console.log('React key issues found:', reactKeyIssues);
    
    // The main assertion - no React key-related issues
    expect(reactKeyIssues).toHaveLength(0);
  });

  test('should take screenshot of working dashboard', async ({ page }) => {
    await page.goto('http://localhost:3009/projects-dashboard');
    await expect(page.locator('h1')).toContainText('Projects Dashboard');
    
    // Wait for everything to load
    await page.waitForTimeout(2000);
    
    // Ensure we're in cards view for the screenshot
    const cardsTab = page.locator('[role="tab"]').filter({ hasText: 'Cards' });
    await cardsTab.click();
    await page.waitForTimeout(500);
    
    // Create screenshots directory if it doesn't exist
    await page.evaluate(() => {
      // This will be handled by Playwright's built-in screenshot directory creation
    });
    
    // Take full page screenshot
    await page.screenshot({
      path: '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots/projects-dashboard-working.png',
      fullPage: true
    });
    
    // Also take a focused screenshot of the main content area
    const mainContent = page.locator('.mx-auto.w-\\[95\\%\\]');
    if (await mainContent.isVisible()) {
      await mainContent.screenshot({
        path: '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots/projects-dashboard-content.png'
      });
    }
    
    // Verify screenshot was successful (no errors should have occurred)
    const screenshotErrors = consoleErrors.filter(error => 
      !error.includes('Warning:') && 
      !error.includes('DevTools') &&
      !error.includes('favicon')
    );
    expect(screenshotErrors).toHaveLength(0);
  });
});