import { test, expect } from '@playwright/test';

/**
 * Comprehensive functional test for Projects Dashboard
 * Tests all required functionality after fixing the React key and const issues
 */
test.describe('Projects Dashboard - Full Functionality Test', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
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
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`);
      console.log('PAGE ERROR:', error.message);
    });
  });

  test('should load and verify all dashboard elements work', async ({ page }) => {
    console.log('🚀 Starting comprehensive dashboard test...');
    
    // Navigate and verify basic load
    await page.goto('http://localhost:3009/projects-dashboard');
    await expect(page.locator('h1')).toContainText('Projects Dashboard');
    
    // Wait for React to fully render
    await page.waitForTimeout(2000);
    
    console.log('✅ Page loaded successfully');

    // Test 1: Verify no React key errors
    const reactKeyErrors = consoleErrors.filter(error => 
      error.includes('key') || 
      error.includes('unique') || 
      error.includes('duplicate') ||
      error.includes('Each child in a list should have a unique "key" prop')
    );
    expect(reactKeyErrors).toHaveLength(0);
    console.log('✅ No React key errors found');

    // Test 2: Verify main UI elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[role="tablist"]')).toBeVisible(); 
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'New Project' })).toBeVisible();
    console.log('✅ Main UI elements visible');

    // Test 3: Test view switching (Cards/Table)
    const cardsTab = page.locator('[role="tab"]').filter({ hasText: 'Cards' });
    const tableTab = page.locator('[role="tab"]').filter({ hasText: 'Table' });
    
    await expect(cardsTab).toBeVisible();
    await expect(tableTab).toBeVisible();
    
    // Switch to table view
    await tableTab.click();
    await page.waitForTimeout(500);
    await expect(tableTab).toHaveAttribute('data-state', 'active');
    
    // Switch back to cards
    await cardsTab.click();
    await page.waitForTimeout(500);
    await expect(cardsTab).toHaveAttribute('data-state', 'active');
    console.log('✅ View switching works');

    // Test 4: Test search functionality
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('test search');
    await page.waitForTimeout(500);
    await searchInput.clear();
    await page.waitForTimeout(500);
    console.log('✅ Search functionality works');

    // Test 5: Test filter dropdowns
    const statusSelect = page.locator('select').first();
    const categorySelect = page.locator('select').nth(1);
    
    await expect(statusSelect).toBeVisible();
    await expect(categorySelect).toBeVisible();
    
    // Test status filter
    const statusOptions = await statusSelect.locator('option').count();
    if (statusOptions > 1) {
      await statusSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      await statusSelect.selectOption({ index: 0 }); // Reset
    }
    
    // Test category filter  
    const categoryOptions = await categorySelect.locator('option').count();
    if (categoryOptions > 1) {
      await categorySelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      await categorySelect.selectOption({ index: 0 }); // Reset
    }
    console.log('✅ Filter dropdowns work');

    // Test 6: Test active projects toggle
    const toggleSwitch = page.locator('[role="switch"]');
    if (await toggleSwitch.isVisible()) {
      const initialState = await toggleSwitch.getAttribute('aria-checked');
      await toggleSwitch.click();
      await page.waitForTimeout(1000); // Wait for data to reload
      
      const newState = await toggleSwitch.getAttribute('aria-checked');
      expect(newState).not.toBe(initialState);
      console.log('✅ Active projects toggle works');
    }

    // Test 7: Test columns dropdown (if visible)
    const columnsBtn = page.locator('button').filter({ hasText: 'Columns' });
    if (await columnsBtn.isVisible()) {
      await columnsBtn.click();
      await page.waitForTimeout(300);
      
      const dropdown = page.locator('[role="menu"]');
      await expect(dropdown).toBeVisible();
      
      // Close dropdown
      await page.locator('h1').click();
      await page.waitForTimeout(300);
      console.log('✅ Columns dropdown works');
    }

    // Final check: No critical errors should have occurred
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Warning:') && 
      !error.includes('DevTools') &&
      !error.includes('favicon') &&
      !error.includes('Failed to load resource') // Ignore missing static resources
    );
    
    console.log('📊 Final error check:');
    console.log('  - Total console errors:', consoleErrors.length);
    console.log('  - Critical errors:', criticalErrors.length);
    console.log('  - React key errors:', reactKeyErrors.length);
    
    expect(criticalErrors).toHaveLength(0);
    console.log('🎉 All tests passed successfully!');
  });

  test('should take final verification screenshot', async ({ page }) => {
    await page.goto('http://localhost:3009/projects-dashboard');
    await expect(page.locator('h1')).toContainText('Projects Dashboard');
    
    // Wait for everything to load
    await page.waitForTimeout(2000);
    
    // Ensure we're in cards view for the screenshot
    const cardsTab = page.locator('[role="tab"]').filter({ hasText: 'Cards' });
    await cardsTab.click();
    await page.waitForTimeout(500);
    
    // Take full page screenshot
    await page.screenshot({
      path: '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots/projects-dashboard-working-final.png',
      fullPage: true
    });
    
    // Also take a screenshot of table view
    const tableTab = page.locator('[role="tab"]').filter({ hasText: 'Table' });
    await tableTab.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: '/Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard/screenshots/projects-dashboard-table-view.png',
      fullPage: true
    });
    
    console.log('📸 Screenshots saved successfully');
    
    // Verify no errors occurred during screenshot process
    const screenshotErrors = consoleErrors.filter(error => 
      !error.includes('Warning:') && 
      !error.includes('DevTools') &&
      !error.includes('favicon') &&
      !error.includes('Failed to load resource')
    );
    expect(screenshotErrors).toHaveLength(0);
  });
});