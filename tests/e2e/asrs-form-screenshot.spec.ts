import { test, expect } from '@playwright/test';

test('ASRS form screenshot verification', async ({ page }) => {
  // Navigate to the ASRS form page - trying different possible routes
  await page.goto('http://localhost:3000/asrs-form');
  
  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');
  
  // Wait for the main form content to be visible
  await page.waitForSelector('h1:has-text("ASRS Sprinkler System Requirements")', { timeout: 10000 });
  
  // Take screenshot of the initial form state
  await page.screenshot({ 
    path: 'screenshots/asrs-form-questions-fixed.png',
    fullPage: true 
  });
  
  // Verify the key elements are present
  await expect(page.locator('text=What type of ASRS system are you implementing?')).toBeVisible();
  await expect(page.locator('text=Step 1 of')).toBeVisible();
  await expect(page.locator('text=Shuttle ASRS')).toBeVisible();
  await expect(page.locator('text=Mini-Load ASRS')).toBeVisible();
  await expect(page.locator('text=Horizontal Carousel')).toBeVisible();
  
  // Test selecting an option and verify Next button appears
  await page.locator('input[value="Shuttle"]').check();
  
  // Wait for the Next button to appear
  await page.waitForSelector('button:has-text("Next")', { timeout: 5000 });
  
  const nextButton = page.locator('button:has-text("Next")');
  await expect(nextButton).toBeVisible();
  await expect(nextButton).toBeEnabled();
  
  // Take another screenshot showing the selected state
  await page.screenshot({ 
    path: 'screenshots/asrs-form-step-1-selected.png',
    fullPage: true 
  });
  
  // Click Next to go to step 2
  await nextButton.click();
  
  // Wait for step 2 to load
  await page.waitForSelector('text=Step 2 of', { timeout: 5000 });
  
  // Verify step 2 content
  await expect(page.locator('text=What type of containers will be stored')).toBeVisible();
  
  // Take screenshot of step 2
  await page.screenshot({ 
    path: 'screenshots/asrs-form-step-2.png',
    fullPage: true 
  });
});