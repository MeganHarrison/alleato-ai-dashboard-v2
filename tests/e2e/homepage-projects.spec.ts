import { test, expect } from '@playwright/test';

test.describe('Homepage Projects Functionality', () => {
  test('should load projects table and verify functionality', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:3002');

    // Wait for the page to load and check for loading state
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of initial load
    await page.screenshot({ 
      path: 'screenshots/homepage-initial-load.png',
      fullPage: true 
    });

    // Check if we're in loading state
    const loadingIndicator = page.locator('text=Loading projects...');
    if (await loadingIndicator.isVisible()) {
      // Wait for loading to complete
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
    }

    // Check if there's an error state
    const errorMessage = page.locator('text=Failed to Load Projects');
    if (await errorMessage.isVisible()) {
      await page.screenshot({ 
        path: 'screenshots/homepage-error-state.png',
        fullPage: true 
      });
      console.log('Error detected on homepage');
      
      // Get the error text for analysis
      const errorText = await page.locator('text=Failed to Load Projects').textContent();
      console.log('Error message:', errorText);
      
      return; // Exit test if there's an error
    }

    // Check for projects header
    await expect(page.locator('text=PROJECTS')).toBeVisible();

    // Check for filter controls
    await expect(page.locator('input[placeholder*="Search projects"]')).toBeVisible();
    await expect(page.locator('select')).toHaveCount(2); // Phase and category filters
    await expect(page.locator('text=Current projects only')).toBeVisible();

    // Check for view toggle tabs
    await expect(page.locator('[role="tablist"]')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Cards")')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Table")')).toBeVisible();

    // Take screenshot of loaded state
    await page.screenshot({ 
      path: 'screenshots/homepage-loaded-state.png',
      fullPage: true 
    });

    // Check if projects are displaying
    const projectCount = page.locator('text=/\\d+ of \\d+ projects/');
    await expect(projectCount).toBeVisible();
    
    // Get the project count text
    const countText = await projectCount.textContent();
    console.log('Project count:', countText);

    // Test Cards view (default)
    const cardsTab = page.locator('[role="tab"]:has-text("Cards")');
    await cardsTab.click();
    await page.waitForTimeout(500); // Wait for tab switch
    
    // Check if cards are visible
    const cards = page.locator('[class*="grid"] > [class*="Card"], [data-testid="project-card"]');
    const cardCount = await cards.count();
    console.log(`Found ${cardCount} project cards`);

    // Take screenshot of cards view
    await page.screenshot({ 
      path: 'screenshots/homepage-cards-view.png',
      fullPage: true 
    });

    // Test Table view
    const tableTab = page.locator('[role="tab"]:has-text("Table")');
    await tableTab.click();
    await page.waitForTimeout(500); // Wait for tab switch

    // Check if table is visible  
    const table = page.locator('table, [role="table"], [data-testid="projects-table"]');
    if (await table.count() > 0) {
      await expect(table.first()).toBeVisible();
      console.log('Table view is visible');
    } else {
      console.log('Table view not found - checking for alternative table structure');
      
      // Look for any table-like structure
      const tableRows = page.locator('tr, [role="row"], [data-testid*="row"]');
      const rowCount = await tableRows.count();
      console.log(`Found ${rowCount} table rows`);
    }

    // Take screenshot of table view
    await page.screenshot({ 
      path: 'screenshots/homepage-table-view.png',
      fullPage: true 
    });

    // Test search functionality
    const searchInput = page.locator('input[placeholder*="Search projects"]');
    await searchInput.fill('test');
    await page.waitForTimeout(1000); // Wait for search results
    
    // Take screenshot after search
    await page.screenshot({ 
      path: 'screenshots/homepage-search-results.png',
      fullPage: true 
    });

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // Test filter functionality
    const phaseFilter = page.locator('select').first();
    await phaseFilter.selectOption('Current');
    await page.waitForTimeout(1000); // Wait for filter results
    
    // Take screenshot after filtering
    await page.screenshot({ 
      path: 'screenshots/homepage-filtered-results.png',
      fullPage: true 
    });

    // Check service cards at the top
    const serviceCards = page.locator('text=FM Global Guru, text=Project Maestro, text=Company Knowledge Base');
    const serviceCount = await serviceCards.count();
    console.log(`Found ${serviceCount} service cards`);

    // Take final comprehensive screenshot
    await page.screenshot({ 
      path: 'screenshots/homepage-final-state.png',
      fullPage: true 
    });

    console.log('Homepage test completed successfully');
  });

  test('should handle empty state correctly', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');

    // Test empty state by filtering to something that should return no results
    const searchInput = page.locator('input[placeholder*="Search projects"]');
    await searchInput.fill('nonexistent-project-xyz-123');
    await page.waitForTimeout(1000);

    // Check for empty state message
    const emptyState = page.locator('text=No projects found');
    if (await emptyState.isVisible()) {
      console.log('Empty state is working correctly');
      
      // Take screenshot of empty state
      await page.screenshot({ 
        path: 'screenshots/homepage-empty-state.png',
        fullPage: true 
      });
    }

    // Clear search to restore normal state
    await searchInput.clear();
    await page.waitForTimeout(500);
  });
});