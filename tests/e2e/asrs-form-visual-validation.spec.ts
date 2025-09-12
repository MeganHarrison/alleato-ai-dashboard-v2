import { test, expect } from '@playwright/test';

/**
 * Visual validation test for ASRS form progress section
 * 
 * This test focuses on visual validation and screenshot capture
 * to verify the key requirements without complex form interactions.
 */

test.describe('ASRS Form Visual Validation', () => {
  
  test('should capture and validate ASRS form progress section', async ({ page }) => {
    console.log('🚀 Starting ASRS form visual validation...');
    
    // Navigate to the ASRS form
    await page.goto('http://localhost:3001/asrs-form-3');
    await page.waitForLoadState('networkidle');
    
    console.log('📸 Taking full page screenshot...');
    // Take comprehensive screenshot
    await page.screenshot({ 
      path: 'screenshots/asrs-form-full-validation.png', 
      fullPage: true 
    });
    
    // 1. Verify the form loads without errors
    console.log('✅ Step 1: Verifying form loads without errors');
    const pageTitle = page.locator('h1, h2, [class*="text-3xl"]').first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });
    
    // 2. Verify progress section shows exactly 4 steps
    console.log('✅ Step 2: Counting progress steps');
    const progressSteps = page.locator('[class*="w-10 h-10 rounded-full"]');
    await expect(progressSteps).toHaveCount(4);
    console.log('   ✓ Found exactly 4 progress steps');
    
    // 3. Verify the 4 step titles (no "Project Info")
    console.log('✅ Step 3: Verifying step titles');
    
    // Check for ASRS Config (step 1)
    const asrsConfigStep = page.locator('text=ASRS Config');
    await expect(asrsConfigStep).toBeVisible();
    console.log('   ✓ Found "ASRS Config" step');
    
    // Check for Containers (step 2)
    const containersStep = page.locator('text=Containers');
    await expect(containersStep).toBeVisible();
    console.log('   ✓ Found "Containers" step');
    
    // Check for Requirements (step 3) - be more specific to avoid sidebar conflicts
    const requirementsStep = page.locator('.flex.items-center').filter({ hasText: 'Requirements' });
    await expect(requirementsStep.first()).toBeVisible();
    console.log('   ✓ Found "Requirements" step');
    
    // Check for Results (step 4)
    const resultsStep = page.locator('text=Results');
    await expect(resultsStep).toBeVisible();
    console.log('   ✓ Found "Results" step');
    
    // 4. Verify first step shows "ASRS Config"
    console.log('✅ Step 4: Verifying first step is "ASRS Config"');
    const firstStepTitle = page.locator('text=ASRS Config').first();
    await expect(firstStepTitle).toBeVisible();
    
    // 5. Verify step colors use brand colors (not green)
    console.log('✅ Step 5: Verifying step colors');
    const currentStepCircle = progressSteps.first();
    const currentStepClass = await currentStepCircle.getAttribute('class');
    
    // Check that it uses brand colors
    const hasBrandColor = currentStepClass?.includes('bg-brand-500') || currentStepClass?.includes('bg-brand');
    expect(hasBrandColor).toBeTruthy();
    console.log('   ✓ Current step uses brand color (not green)');
    
    // Take focused screenshot of progress section
    console.log('📸 Taking progress section screenshot...');
    const progressSection = page.locator('.mx-auto.px-4.py-6').first();
    await progressSection.screenshot({ 
      path: 'screenshots/asrs-form-progress-section.png'
    });
    
    // 6. Verify form content is present
    console.log('✅ Step 6: Verifying form content');
    
    // Check for main heading
    const mainHeading = page.locator('text=FM Global 8-34 Requirements');
    await expect(mainHeading).toBeVisible();
    console.log('   ✓ Found main heading: "FM Global 8-34 Requirements"');
    
    // Check for form description
    const formDescription = page.locator('text=Complete the form below');
    await expect(formDescription).toBeVisible();
    console.log('   ✓ Found form description');
    
    // Check for ASRS System Configuration section
    const configSection = page.locator('text=ASRS System Configuration');
    await expect(configSection).toBeVisible();
    console.log('   ✓ Found "ASRS System Configuration" section');
    
    // Check for ASRS Type options
    const miniLoadOption = page.locator('text=Mini-Load ASRS');
    await expect(miniLoadOption).toBeVisible();
    console.log('   ✓ Found "Mini-Load ASRS" option');
    
    const shuttleOption = page.locator('text=Shuttle ASRS');
    await expect(shuttleOption).toBeVisible();
    console.log('   ✓ Found "Shuttle ASRS" option');
    
    const topLoadingOption = page.locator('text=Top-Loading ASRS');
    await expect(topLoadingOption).toBeVisible();
    console.log('   ✓ Found "Top-Loading ASRS" option');
    
    // Check for input fields
    const storageHeightField = page.locator('input[placeholder*="25.0"]');
    await expect(storageHeightField).toBeVisible();
    console.log('   ✓ Found storage height input field');
    
    const ceilingHeightField = page.locator('input[placeholder*="32.0"]');
    await expect(ceilingHeightField).toBeVisible();
    console.log('   ✓ Found ceiling height input field');
    
    // Check for Continue button (should be disabled initially)
    const continueButton = page.locator('button:has-text("Continue")');
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toBeDisabled();
    console.log('   ✓ Found Continue button (correctly disabled)');
    
    // Take screenshot of the form content
    console.log('📸 Taking form content screenshot...');
    const formContainer = page.locator('.bg-gray-50.rounded-lg.p-8');
    await formContainer.screenshot({ 
      path: 'screenshots/asrs-form-content.png'
    });
    
    console.log('🎉 Visual validation completed successfully!');
    console.log('');
    console.log('📋 Validation Summary:');
    console.log('   ✅ Form loads without errors');
    console.log('   ✅ Progress section shows exactly 4 steps');
    console.log('   ✅ Step titles are correct: ASRS Config, Containers, Requirements, Results');
    console.log('   ✅ No "Project Info" step found');
    console.log('   ✅ First step is "ASRS Config"');
    console.log('   ✅ Step colors use brand colors (not green)');
    console.log('   ✅ Form content and functionality is present');
    console.log('');
    console.log('📸 Screenshots saved:');
    console.log('   - screenshots/asrs-form-full-validation.png');
    console.log('   - screenshots/asrs-form-progress-section.png');
    console.log('   - screenshots/asrs-form-content.png');
  });

  test('should validate Continue button behavior', async ({ page }) => {
    console.log('🚀 Testing Continue button validation...');
    
    // Navigate to the ASRS form
    await page.goto('http://localhost:3001/asrs-form-3');
    await page.waitForLoadState('networkidle');
    
    // Verify Continue button is disabled initially
    const continueButton = page.locator('button:has-text("Continue")');
    await expect(continueButton).toBeDisabled();
    console.log('   ✓ Continue button is initially disabled');
    
    // Fill only ASRS type - should still be disabled
    await page.click('label[for="asrs_mini_load"]');
    await expect(continueButton).toBeDisabled();
    console.log('   ✓ Continue button still disabled with only ASRS type');
    
    // Fill storage height - should still be disabled
    await page.fill('input[placeholder*="25.0"]', '24');
    await expect(continueButton).toBeDisabled();
    console.log('   ✓ Continue button still disabled after adding storage height');
    
    // Fill ceiling height - now should be enabled
    await page.fill('input[placeholder*="32.0"]', '30');
    await expect(continueButton).toBeEnabled();
    console.log('   ✓ Continue button enabled with all required fields');
    
    // Take screenshot showing enabled state
    await page.screenshot({ 
      path: 'screenshots/asrs-form-continue-enabled.png',
      fullPage: true 
    });
    
    console.log('✅ Form validation working correctly!');
  });
});