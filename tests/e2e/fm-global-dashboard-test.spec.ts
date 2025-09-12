import { test, expect } from '@playwright/test';

test('FM Global Dashboard - Updated Tab Structure', async ({ page }) => {
  await page.goto('http://localhost:3000/fm-global-dashboard');
  
  // Check for the new tab structure - using more specific selectors
  await expect(page.getByRole('tab', { name: 'Figures and Tables' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'FM Global Form' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Chat' })).toBeVisible();
  
  // Take screenshot of the default tab (Figures and Tables)
  await page.screenshot({ 
    path: 'screenshots/fm-global-dashboard-updated.png',
    fullPage: true 
  });
  
  // Test tab navigation
  await page.getByRole('tab', { name: 'FM Global Form' }).click();
  await page.waitForTimeout(1000);
  
  await page.getByRole('tab', { name: 'Chat' }).click();
  await page.waitForTimeout(1000);
  
  console.log('FM Global Dashboard updated successfully with new tab structure');
});