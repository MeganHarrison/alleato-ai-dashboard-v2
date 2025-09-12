import { test, expect } from '@playwright/test';

test.describe('ASRS Form Quote Generation - Fixed Test', () => {
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
    
    // Step 1: Select ASRS Type - Shuttle ASRS (click on the label)
    await expect(page.locator('text=What type of ASRS system are you implementing?')).toBeVisible();
    await page.click('label:has-text("Shuttle ASRS")');
    await page.screenshot({ 
      path: 'screenshots/asrs-form-step1-shuttle.png',
      fullPage: true 
    });
    
    // Click Next
    await page.click('button:has-text("Next")');
    
    // Step 2: Container Type - Closed-Top
    await expect(page.locator('text=What type of containers will be stored')).toBeVisible();
    await page.click('label:has-text("Closed-Top Containers")');
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
    
    // Step 7: Commodity Type - Select multiple (click on checkboxes within labels)
    await expect(page.locator('text=What types of commodities will be stored?')).toBeVisible();
    await page.click('label:has-text("Class III Commodities")');
    await page.click('label:has-text("Cartoned Unexpanded Plastics")');
    await page.screenshot({ 
      path: 'screenshots/asrs-form-step7-commodity.png',
      fullPage: true 
    });
    
    // Click Next
    await page.click('button:has-text("Next")');
    
    // Step 8: System Type - Final step
    await expect(page.locator('text=What type of sprinkler system will be used?')).toBeVisible();
    await page.click('label:has-text("Wet System")');
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
      
      // Check for any alerts or error dialogs
      const hasAlert = await page.evaluate(() => {
        // Check if any alerts were shown
        return document.querySelector('[role="alert"]') !== null;
      });
      
      if (hasAlert) {
        console.log('❌ Alert dialog detected');
      }
      
      throw new Error(`Form submission failed: ${error}`);
    }
  });

  test('should load form correctly and show initial state', async ({ page }) => {
    // Verify the form loads with correct initial elements
    await expect(page.locator('h1')).toContainText('ASRS Sprinkler System Requirements');
    await expect(page.locator('text=Answer these questions to determine')).toBeVisible();
    await expect(page.locator('text=Step 1 of')).toBeVisible();
    
    // Check that the first question is visible
    await expect(page.locator('text=What type of ASRS system are you implementing?')).toBeVisible();
    
    // Check that all three ASRS type options are present
    await expect(page.locator('text=Shuttle ASRS')).toBeVisible();
    await expect(page.locator('text=Mini-Load ASRS')).toBeVisible();
    await expect(page.locator('text=Horizontal Carousel')).toBeVisible();
    
    // Check progress bar
    await expect(page.locator('.bg-blue-600')).toBeVisible();
    
    // Previous button should be disabled on first step
    await expect(page.locator('button:has-text("Previous")')).toBeDisabled();
    
    // Next button should be disabled until selection is made
    await expect(page.locator('button:has-text("Next")')).toBeDisabled();
    
    await page.screenshot({ 
      path: 'screenshots/asrs-form-initial-validation.png',
      fullPage: true 
    });
    
    console.log('✅ ASRS Form Load Test: SUCCESS - Form loads correctly with proper initial state');
  });

  test('should validate API endpoint is available', async ({ page }) => {
    // Test the API endpoint directly
    const response = await page.request.get('http://localhost:3007/api/fm-global/form');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.engine).toContain('FM Global');
    
    console.log('✅ API Endpoint Test: SUCCESS - FM Global API is healthy and responsive');
    console.log('API Response:', JSON.stringify(data, null, 2));
  });
});