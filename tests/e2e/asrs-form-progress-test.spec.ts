import { test, expect } from '@playwright/test';

/**
 * Comprehensive test for ASRS form progress section and functionality
 * 
 * Tests the following requirements:
 * 1. Form loads without errors
 * 2. Progress section shows 4 steps instead of 5 (no "Project Info" step)
 * 3. First step shows "ASRS Config"
 * 4. Step colors use light brand color for completed steps instead of green
 * 5. All step transitions work correctly
 * 6. Form functionality works end-to-end
 */

test.describe('ASRS Form Progress Section and Functionality', () => {
  
  test('should display correct progress steps and functionality', async ({ page }) => {
    // First, try to navigate to the ASRS form directly
    // If it redirects to login, we'll handle authentication
    await page.goto('http://localhost:3001/asrs-form-3');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Take an initial screenshot
    await page.screenshot({ 
      path: 'screenshots/asrs-form-initial.png', 
      fullPage: true 
    });
    
    // 1. Verify the form loads without errors
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    
    // 2. Verify progress section shows exactly 4 steps
    const progressSteps = page.locator('[class*="flex items-center"] [class*="w-10 h-10 rounded-full"]');
    await expect(progressSteps).toHaveCount(4);
    
    // 3. Verify the step titles are correct (no "Project Info" step)
    const expectedSteps = ['ASRS Config', 'Containers', 'Requirements', 'Results'];
    
    for (let i = 0; i < expectedSteps.length; i++) {
      const stepTitle = page.locator('text=' + expectedSteps[i]);
      await expect(stepTitle).toBeVisible();
    }
    
    // 4. Verify first step shows "ASRS Config"
    const firstStepTitle = page.locator('text=ASRS Config').first();
    await expect(firstStepTitle).toBeVisible();
    
    // 5. Verify step colors - current step should use brand colors
    const currentStepCircle = progressSteps.first();
    const currentStepClass = await currentStepCircle.getAttribute('class');
    expect(currentStepClass).toContain('bg-brand-500');
    
    // Take screenshot showing the 4-step progress section
    await page.screenshot({ 
      path: 'screenshots/asrs-form-4-steps-progress.png',
      clip: { x: 0, y: 0, width: 1200, height: 200 }
    });
    
    // 6. Test form functionality - Step 1: ASRS Config
    console.log('Testing Step 1: ASRS Configuration');
    
    // Select ASRS type - Mini-Load
    await page.click('label[for="asrs_mini_load"]');
    
    // Fill storage height
    await page.fill('input[placeholder="e.g., 25.0"]', '24');
    
    // Fill ceiling height  
    await page.fill('input[placeholder="e.g., 32.0"]', '30');
    
    // Verify Continue button is enabled
    const continueButton = page.locator('button:has-text("Continue")');
    await expect(continueButton).toBeEnabled();
    
    // Click Continue to go to step 2
    await continueButton.click();
    
    // Wait for step transition
    await page.waitForTimeout(1000);
    
    // Verify we're on step 2 - check for "Container & Commodity Information" header
    await expect(page.locator('h2:has-text("Container & Commodity Information")')).toBeVisible();
    
    // Verify step indicator shows step 2 as current (brand color) and step 1 as completed
    const step2Circle = progressSteps.nth(1);
    const step2Class = await step2Circle.getAttribute('class');
    expect(step2Class).toContain('bg-brand-500');
    
    // Verify step 1 is marked as completed with light brand color
    const step1Circle = progressSteps.first();
    const step1Class = await step1Circle.getAttribute('class');
    expect(step1Class).toContain('bg-brand-200');
    
    // Take screenshot showing step transition
    await page.screenshot({ 
      path: 'screenshots/asrs-form-step2-transition.png',
      fullPage: true 
    });
    
    // 7. Test Step 2: Container & Commodity
    console.log('Testing Step 2: Container & Commodity');
    
    // Select container type - Combustible Closed-Top
    await page.click('label[for="container_combustible_closed"]');
    
    // Select commodity class - Class 3
    await page.click('label[for="commodity_class_3"]');
    
    // Continue to step 3
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(1000);
    
    // Verify we're on step 3
    await expect(page.locator('h2:has-text("System Requirements")')).toBeVisible();
    
    // 8. Test Step 3: System Requirements
    console.log('Testing Step 3: System Requirements');
    
    // Wet system should be selected by default
    const wetSystemRadio = page.locator('input[value="wet"]');
    await expect(wetSystemRadio).toBeChecked();
    
    // Continue to get results (step 4)
    await page.click('button:has-text("Get Design Requirements")');
    
    // Wait for calculation to complete
    await page.waitForTimeout(4000); // Wait for the 3 second mock calculation
    
    // 9. Verify Step 4: Results
    console.log('Testing Step 4: Results');
    
    // Check that we're on the results step
    await expect(page.locator('h2:has-text("Design Requirements & Recommendations")')).toBeVisible();
    
    // Verify results are displayed
    await expect(page.locator('text=Primary Protection Requirements')).toBeVisible();
    await expect(page.locator('text=Protection Scheme')).toBeVisible();
    await expect(page.locator('text=Estimated System Cost')).toBeVisible();
    
    // Verify all steps are now completed or current
    for (let i = 0; i < 4; i++) {
      const stepCircle = progressSteps.nth(i);
      const stepClass = await stepCircle.getAttribute('class');
      // Should have brand color (either current or completed)
      expect(stepClass).toMatch(/bg-brand-(200|500)/);
    }
    
    // Take final screenshot showing completed form
    await page.screenshot({ 
      path: 'screenshots/asrs-form-completed.png',
      fullPage: true 
    });
    
    // 10. Test Download Report functionality
    console.log('Testing Download Report functionality');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download Report")');
    const download = await downloadPromise;
    
    // Verify download was triggered
    expect(download.suggestedFilename()).toContain('ASRS_Design_Report');
    
    console.log('✅ All ASRS form tests passed successfully!');
  });

  test('should handle Previous button navigation correctly', async ({ page }) => {
    // Navigate to the ASRS form
    await page.goto('http://localhost:3001/asrs-form-3');
    await page.waitForLoadState('networkidle');
    
    // Complete step 1 to get to step 2
    await page.click('label[for="asrs_mini_load"]');
    await page.fill('input[placeholder="e.g., 25.0"]', '24');
    await page.fill('input[placeholder="e.g., 32.0"]', '30');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(500);
    
    // Verify Previous button exists and works
    await expect(page.locator('button:has-text("Previous")')).toBeVisible();
    await page.click('button:has-text("Previous")');
    
    // Verify we're back on step 1
    await expect(page.locator('h2:has-text("ASRS System Configuration")')).toBeVisible();
    
    // Take screenshot showing Previous navigation
    await page.screenshot({ 
      path: 'screenshots/asrs-form-previous-navigation.png',
      fullPage: true 
    });
  });

  test('should disable Continue button when required fields are empty', async ({ page }) => {
    // Navigate to the ASRS form
    await page.goto('http://localhost:3001/asrs-form-3');
    await page.waitForLoadState('networkidle');
    
    // Verify Continue button is disabled initially
    const continueButton = page.locator('button:has-text("Continue")');
    await expect(continueButton).toBeDisabled();
    
    // Fill only ASRS type - should still be disabled
    await page.click('label[for="asrs_mini_load"]');
    await expect(continueButton).toBeDisabled();
    
    // Fill storage height - should still be disabled
    await page.fill('input[placeholder="e.g., 25.0"]', '24');
    await expect(continueButton).toBeDisabled();
    
    // Fill ceiling height - now should be enabled
    await page.fill('input[placeholder="e.g., 32.0"]', '30');
    await expect(continueButton).toBeEnabled();
    
    console.log('✅ Form validation working correctly!');
  });
});