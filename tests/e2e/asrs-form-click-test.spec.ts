import { test, expect } from '@playwright/test';

test('ASRS form click interaction test', async ({ page }) => {
  // Navigate to the ASRS form page
  await page.goto('http://localhost:3000/asrs-form');
  
  // Wait for the form to load
  await page.waitForSelector('h1:has-text("ASRS Sprinkler System Requirements")', { timeout: 10000 });
  
  // Take initial screenshot
  await page.screenshot({ 
    path: 'screenshots/asrs-form-initial-state.png',
    fullPage: true 
  });
  
  // Click on the label instead of the hidden radio button to select Shuttle ASRS
  await page.locator('label:has-text("Shuttle ASRS")').click();
  
  // Wait a moment for the selection to register
  await page.waitForTimeout(1000);
  
  // Verify the option is selected by checking if the container has the selected styling
  await expect(page.locator('label:has-text("Shuttle ASRS")').locator('input')).toBeChecked();
  
  // Take screenshot showing selected state
  await page.screenshot({ 
    path: 'screenshots/asrs-form-shuttle-selected.png',
    fullPage: true 
  });
  
  // Now the Next button should appear - use a more flexible selector
  const nextButton = page.locator('button').filter({ hasText: /Next|→/ });
  await expect(nextButton).toBeVisible();
  await expect(nextButton).toBeEnabled();
  
  // Take final screenshot showing Next button
  await page.screenshot({ 
    path: 'screenshots/asrs-form-with-next-button.png',
    fullPage: true 
  });
});