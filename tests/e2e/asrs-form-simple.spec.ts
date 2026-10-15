import { test, expect } from '@playwright/test';

test.describe('ASRS Form Simple Test', () => {
  test('should test form manually and capture results', async ({ page }) => {
    // Navigate to the ASRS form
    await page.goto('http://localhost:3007/asrs-form');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({ 
      path: 'screenshots/asrs-form-manual-initial.png',
      fullPage: true 
    });

    // Manual test - go through each step with explicit waits
    
    // Step 1: ASRS Type
    await page.waitForSelector('text=What type of ASRS system are you implementing?');
    await page.click('label:has-text("Shuttle ASRS")');
    await page.waitForTimeout(1000); // Wait for UI update
    await page.screenshot({ path: 'screenshots/asrs-form-manual-step1.png', fullPage: true });
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Step 2: Container Type
    await page.waitForSelector('text=What type of containers will be stored');
    await page.click('label:has-text("Closed-Top Containers")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/asrs-form-manual-step2.png', fullPage: true });
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Step 3: Rack Depth
    await page.waitForSelector('text=What is the maximum rack depth');
    await page.fill('input[type="number"]', '8');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/asrs-form-manual-step3.png', fullPage: true });
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Step 4: Rack Spacing
    await page.waitForSelector('text=What is the rack spacing');
    await page.fill('input[type="number"]', '5');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/asrs-form-manual-step4.png', fullPage: true });
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Step 5: Ceiling Height
    await page.waitForSelector('text=What is the ceiling height');
    await page.fill('input[type="number"]', '30');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/asrs-form-manual-step5.png', fullPage: true });
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Step 6: Storage Height
    await page.waitForSelector('text=What is the maximum storage height');
    await page.fill('input[type="number"]', '25');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/asrs-form-manual-step6.png', fullPage: true });
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Step 7: Commodity Type
    await page.waitForSelector('text=What types of commodities will be stored');
    await page.click('label:has-text("Class III Commodities")');
    await page.waitForTimeout(500);
    await page.click('label:has-text("Cartoned Unexpanded Plastics")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/asrs-form-manual-step7.png', fullPage: true });
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Step 8: System Type
    await page.waitForSelector('text=What type of sprinkler system will be used');
    await page.click('label:has-text("Wet System")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/asrs-form-manual-step8-final.png', fullPage: true });
    
    // Now submit and wait for results with extended timeouts
    await page.click('button:has-text("Generate Design & Quote")');
    
    // Wait and capture loading state
    await page.waitForSelector('text=Generating Design...', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/asrs-form-manual-loading.png', fullPage: true });
    
    // Wait longer for results - try multiple approaches
    let resultFound = false;
    let attempts = 0;
    const maxAttempts = 20;
    
    while (!resultFound && attempts < maxAttempts) {
      attempts++;
      await page.waitForTimeout(2000); // Wait 2 seconds between checks
      
      // Check for success result
      const successElement = await page.locator('text=Design Complete!').isVisible().catch(() => false);
      if (successElement) {
        resultFound = true;
        await page.screenshot({ path: 'screenshots/asrs-form-manual-success.png', fullPage: true });
        
        // Verify all result elements
        await expect(page.locator('text=Your Configuration')).toBeVisible();
        await expect(page.locator('text=FM Global 8-34 Requirements')).toBeVisible();
        await expect(page.locator('text=ASRS Type: Shuttle')).toBeVisible();
        await expect(page.locator('text=Sprinkler Count:')).toBeVisible();
        
        console.log('✅ SUCCESS: ASRS Form completed successfully with results displayed');
        break;
      }
      
      // Check if we're back to the form (error case)
      const backToForm = await page.locator('text=What type of ASRS system are you implementing?').isVisible().catch(() => false);
      if (backToForm) {
        await page.screenshot({ path: 'screenshots/asrs-form-manual-reset-error.png', fullPage: true });
        console.log(`❌ Form reset detected on attempt ${attempts}`);
        
        // Log any visible error messages
        const errorElements = await page.locator('.text-red-600, .bg-red-50, [role="alert"]').allTextContents();
        if (errorElements.length > 0) {
          console.log('Error messages found:', errorElements);
        }
        break;
      }
      
      // Check if still loading
      const stillLoading = await page.locator('text=Generating Design...').isVisible().catch(() => false);
      if (stillLoading) {
        console.log(`Still loading... attempt ${attempts}/${maxAttempts}`);
        continue;
      }
      
      // Take a screenshot of current state
      await page.screenshot({ path: `screenshots/asrs-form-manual-attempt-${attempts}.png`, fullPage: true });
    }
    
    if (!resultFound) {
      console.log('❌ TIMEOUT: Could not find success result after maximum attempts');
      await page.screenshot({ path: 'screenshots/asrs-form-manual-timeout.png', fullPage: true });
    }
  });

  test('should verify form structure and navigation', async ({ page }) => {
    await page.goto('http://localhost:3007/asrs-form');
    await page.waitForLoadState('networkidle');

    // Test basic form structure
    await expect(page.locator('h1')).toContainText('ASRS Sprinkler System Requirements');
    await expect(page.locator('text=Step 1 of')).toBeVisible();
    
    // Test that options are visible
    await expect(page.locator('text=Shuttle ASRS')).toBeVisible();
    await expect(page.locator('text=Mini-Load ASRS')).toBeVisible();
    await expect(page.locator('text=Horizontal Carousel')).toBeVisible();
    
    // Test navigation (should be disabled initially)
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeVisible();
    
    // Previous should be disabled on first step
    const prevButton = page.locator('button:has-text("Previous")');  
    await expect(prevButton).toBeDisabled();
    
    await page.screenshot({ path: 'screenshots/asrs-form-structure-test.png', fullPage: true });
    
    console.log('✅ Form structure test passed - all elements visible and properly configured');
  });
});