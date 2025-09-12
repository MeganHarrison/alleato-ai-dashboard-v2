import { test, expect } from '@playwright/test';

test.describe('Login Functionality', () => {
  // Use port 3003 since that's where the dev server is running
  const baseUrl = 'http://localhost:3003';

  test('should show login form with proper elements', async ({ page }) => {
    await page.goto(`${baseUrl}/auth/login`);
    
    // Check form elements are present
    await expect(page.getByText('Login to your account')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(`${baseUrl}/auth/login`);
    
    // Fill in invalid credentials
    await page.locator('input[name="email"]').fill('invalid@test.com');
    await page.locator('input[name="password"]').fill('wrongpassword');
    
    // Submit the form
    await page.getByRole('button', { name: /login/i }).click();
    
    // Wait for error message to appear
    await expect(page.locator('[class*="destructive"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto(`${baseUrl}/auth/login`);
    
    // Try to submit without filling fields (should trigger browser validation)
    await page.getByRole('button', { name: /login/i }).click();
    
    // Check that we're still on the login page (browser validation should prevent submission)
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('login form should be accessible via keyboard', async ({ page }) => {
    await page.goto(`${baseUrl}/auth/login`);
    
    // Tab through form elements
    await page.keyboard.press('Tab'); // Should focus first focusable element
    await page.keyboard.press('Tab'); // Should focus email input
    await expect(page.locator('input[name="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Should focus password input
    await expect(page.locator('input[name="password"]')).toBeFocused();
  });
});