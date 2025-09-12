import { test, expect } from '@playwright/test';

test('ASRS form questions display correctly', async ({ page }) => {
  // Navigate to the ASRS form page
  await page.goto('http://localhost:3004/asrs-form');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Verify the first question is visible
  const firstQuestion = page.locator('text=What type of ASRS system are you implementing?');
  await expect(firstQuestion).toBeVisible();
  
  // Verify step progress is shown
  const stepProgress = page.locator('text=Step 1');
  await expect(stepProgress).toBeVisible();
  
  // Verify the three main ASRS options are displayed
  await expect(page.locator('text=Shuttle ASRS')).toBeVisible();
  await expect(page.locator('text=Mini-Load ASRS')).toBeVisible();
  await expect(page.locator('text=Horizontal Carousel')).toBeVisible();
  
  // Verify descriptions are present
  await expect(page.locator('text=Horizontal loading mechanism with shuttle carriers')).toBeVisible();
  await expect(page.locator('text=Vertical loading for smaller items')).toBeVisible();
  await expect(page.locator('text=Rotating carousel system for medium-density applications')).toBeVisible();
  
  // Take screenshot of the initial form state
  await page.screenshot({ 
    path: 'screenshots/asrs-form-questions-fixed.png',
    fullPage: true 
  });
  
  // Test that selecting an option shows and enables the Next button
  await page.locator('input[value="Shuttle"]').check();
  
  // Now verify Next button appears and is enabled
  const nextButton = page.locator('button', { hasText: 'Next' });
  await expect(nextButton).toBeVisible();
  await expect(nextButton).toBeEnabled();
  
  // Click Next to verify navigation works
  await nextButton.click();
  
  // Verify we moved to the next step
  const step2 = page.locator('text=Step 2');
  await expect(step2).toBeVisible();
  
  // Take screenshot of step 2 as well
  await page.screenshot({ 
    path: 'screenshots/asrs-form-step-2.png',
    fullPage: true 
  });
});