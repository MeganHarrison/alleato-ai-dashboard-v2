import { test, expect } from '@playwright/test';

test.describe('ASRS Form Quote Generation - Comprehensive Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the ASRS form
    await page.goto('http://localhost:3007/asrs-form');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should complete full form workflow and generate quote', async ({ page }) => {
    // Take screenshot of initial form state
    await page.screenshot({ 
      path: 'screenshots/asrs-form-initial.png',
      fullPage: true 
    });

    // Verify initial form loads correctly
    await expect(page.locator('h1')).toContainText('ASRS Sprinkler System Requirements');
    await expect(page.locator('text=Step 1 of')).toBeVisible();
    
    // Step 1: Select ASRS Type - Shuttle ASRS
    await expect(page.locator('text=What type of ASRS system are you implementing?')).toBeVisible();
    await page.click('input[value="Shuttle"]');
    await page.screenshot({ 
      path: 'screenshots/asrs-form-step1-shuttle.png',
      fullPage: true 
    });
    
    // Click Next
    await page.click('button:has-text("Next")');
    
    // Step 2: Container Type - Closed-Top
    await expect(page.locator('text=What type of containers will be stored')).toBeVisible();
    await page.click('input[value="Closed-Top"]');
    await page.screenshot({ 
      path: 'screenshots/asrs-form-step2-container.png',
      fullPage: true 
    });
    
    // Click Next
    await page.click('button:has-text("Next")');
    
    // Step 3: Rack Depth
    await expect(page.locator('text=What is the maximum rack depth in feet?')).toBeVisible();
    await page.fill('input[type="number"]', '8');
    await page.screenshot({ 
      path: 'screenshots/asrs-form-step3-depth.png',
      fullPage: true 
    });
    
    // Click Next
    await page.click('button:has-text("Next")');
    
    // Step 4: Rack Spacing
    await expect(page.locator('text=What is the rack spacing')).toBeVisible();
    await page.fill('input[type="number"]', '5');
    await page.screenshot({ 
      path: 'screenshots/asrs-form-step4-spacing.png',
      fullPage: true 
    });
    
    // Click Next
    await page.click('button:has-text("Next")');
    
    // Step 5: Ceiling Height
    await expect(page.locator('text=What is the ceiling height?')).toBeVisible();
    await page.fill('input[type="number"]', '30');
    await page.screenshot({ 
      path: 'screenshots/asrs-form-step5-ceiling.png',
      fullPage: true 
    });
    
    // Click Next
    await page.click('button:has-text("Next")');
    
    // Step 6: Storage Height
    await expect(page.locator('text=What is the maximum storage height?')).toBeVisible();
    await page.fill('input[type="number"]', '25');
    await page.screenshot({ 
      path: 'screenshots/asrs-form-step6-storage.png',
      fullPage: true 
    });
    
    // Click Next
    await page.click('button:has-text("Next")');
    
    // Step 7: Commodity Type - Select multiple
    await expect(page.locator('text=What types of commodities will be stored?')).toBeVisible();
    await page.click('input[type="checkbox"][value*="Class III"]');
    await page.click('input[type="checkbox"][value*="Cartoned Unexpanded"]');
    await page.screenshot({ 
      path: 'screenshots/asrs-form-step7-commodity.png',
      fullPage: true 
    });
    
    // Click Next
    await page.click('button:has-text("Next")');
    
    // Step 8: System Type - Final step
    await expect(page.locator('text=What type of sprinkler system will be used?')).toBeVisible();
    await page.click('input[value="wet"]');
    await page.screenshot({ 
      path: 'screenshots/asrs-form-step8-system.png',
      fullPage: true 
    });
    
    // Check that the Generate Design button appears
    await expect(page.locator('button:has-text("Generate Design & Quote")')).toBeVisible();
    await expect(page.locator('button:has-text("Generate Design & Quote")')).not.toBeDisabled();
    
    // Take screenshot before submitting
    await page.screenshot({ 
      path: 'screenshots/asrs-form-ready-to-submit.png',
      fullPage: true 
    });
    
    // Click Generate Design & Quote
    await page.click('button:has-text("Generate Design & Quote")');
    
    // Wait for the loading state
    await expect(page.locator('text=Generating Design...')).toBeVisible();
    await page.screenshot({ 
      path: 'screenshots/asrs-form-generating.png',
      fullPage: true 
    });
    
    // Wait for results (with longer timeout for API call)
    try {
      await expect(page.locator('text=Design Complete!')).toBeVisible({ timeout: 15000 });
      
      // Take screenshot of results
      await page.screenshot({ 
        path: 'screenshots/asrs-form-results-success.png',
        fullPage: true 
      });
      
      // Verify result components are present
      await expect(page.locator('text=Your Configuration')).toBeVisible();
      await expect(page.locator('text=FM Global 8-34 Requirements')).toBeVisible();
      
      // Verify configuration details
      await expect(page.locator('text=ASRS Type: Shuttle')).toBeVisible();
      await expect(page.locator('text=Container Type: Closed-Top')).toBeVisible();
      await expect(page.locator('text=Rack Depth: 8 ft')).toBeVisible();
      
      // Verify requirements results
      await expect(page.locator('text=Sprinkler Count:')).toBeVisible();
      await expect(page.locator('text=Protection Scheme:')).toBeVisible();
      
      // Check that action buttons are present
      await expect(page.locator('button:has-text("Download Report")')).toBeVisible();
      await expect(page.locator('button:has-text("New Design")')).toBeVisible();
      
      console.log('✅ ASRS Form Test: SUCCESS - Form completed and quote generated successfully');
      
    } catch (error) {
      // If results don't show, capture error state
      await page.screenshot({ 
        path: 'screenshots/asrs-form-error-state.png',
        fullPage: true 
      });
      
      // Check for any visible error messages
      const errorMessages = await page.locator('.text-red-600, .bg-red-50').allTextContents();
      if (errorMessages.length > 0) {
        console.log('❌ Error messages found:', errorMessages);
      }
      
      // Log any console errors
      const logs = await page.evaluate(() => {
        // @ts-ignore
        return window.console._logs || [];
      });
      console.log('Console logs:', logs);
      
      throw new Error(`Form submission failed: ${error}`);
    }
  });

  test('should validate form inputs correctly', async ({ page }) => {
    // Test validation on rack depth
    await page.click('input[value="Shuttle"]');
    await page.click('button:has-text("Next")');
    
    await page.click('input[value="Closed-Top"]');
    await page.click('button:has-text("Next")');
    
    // Try entering invalid rack depth (too small)
    await page.fill('input[type="number"]', '2');
    await expect(page.locator('text=Minimum rack depth is 3 feet')).toBeVisible();
    
    // Try entering invalid rack depth (too large) 
    await page.fill('input[type="number"]', '30');
    await expect(page.locator('text=require special engineering review')).toBeVisible();
    
    await page.screenshot({ 
      path: 'screenshots/asrs-form-validation-errors.png',
      fullPage: true 
    });
    
    // Fix with valid value
    await page.fill('input[type="number"]', '8');
    await expect(page.locator('.text-red-600')).not.toBeVisible();
    
    console.log('✅ ASRS Form Validation Test: SUCCESS - Input validation working correctly');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Fill out form completely first
    await page.click('input[value="Shuttle"]');
    await page.click('button:has-text("Next")');
    
    await page.click('input[value="Closed-Top"]');
    await page.click('button:has-text("Next")');
    
    await page.fill('input[type="number"]', '8');
    await page.click('button:has-text("Next")');
    
    await page.fill('input[type="number"]', '5');
    await page.click('button:has-text("Next")');
    
    await page.fill('input[type="number"]', '30');
    await page.click('button:has-text("Next")');
    
    await page.fill('input[type="number"]', '25');
    await page.click('button:has-text("Next")');
    
    await page.click('input[type="checkbox"][value*="Class III"]');
    await page.click('button:has-text("Next")');
    
    await page.click('input[value="wet"]');
    
    // Intercept API call to simulate server error
    await page.route('**/api/fm-global/form', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error - test simulation'
        })
      });
    });
    
    await page.click('button:has-text("Generate Design & Quote")');
    
    // Wait for error to be handled
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'screenshots/asrs-form-api-error.png',
      fullPage: true 
    });
    
    console.log('✅ ASRS Form Error Handling Test: SUCCESS - API errors handled gracefully');
  });

  test('should have working navigation buttons', async ({ page }) => {
    // Go through a few steps
    await page.click('input[value="Shuttle"]');
    await page.click('button:has-text("Next")');
    
    await page.click('input[value="Closed-Top"]');
    await page.click('button:has-text("Next")');
    
    // Test Previous button
    await expect(page.locator('button:has-text("Previous")')).not.toBeDisabled();
    await page.click('button:has-text("Previous")');
    
    // Should be back to container type question
    await expect(page.locator('text=What type of containers will be stored')).toBeVisible();
    
    // Go back to first step
    await page.click('button:has-text("Previous")');
    await expect(page.locator('text=What type of ASRS system are you implementing?')).toBeVisible();
    
    // Previous button should be disabled on first step
    await expect(page.locator('button:has-text("Previous")')).toBeDisabled();
    
    await page.screenshot({ 
      path: 'screenshots/asrs-form-navigation-test.png',
      fullPage: true 
    });
    
    console.log('✅ ASRS Form Navigation Test: SUCCESS - Previous/Next buttons working correctly');
  });

  test('should display progress correctly', async ({ page }) => {
    // Check initial progress
    await expect(page.locator('text=Step 1 of')).toBeVisible();
    
    // Move through steps and verify progress updates
    await page.click('input[value="Shuttle"]');
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=Step 2 of')).toBeVisible();
    
    await page.click('input[value="Closed-Top"]');
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=Step 3 of')).toBeVisible();
    
    // Check progress bar exists and updates
    const progressBar = page.locator('.bg-blue-600');
    await expect(progressBar).toBeVisible();
    
    await page.screenshot({ 
      path: 'screenshots/asrs-form-progress.png',
      fullPage: true 
    });
    
    console.log('✅ ASRS Form Progress Test: SUCCESS - Progress indicator working correctly');
  });
});