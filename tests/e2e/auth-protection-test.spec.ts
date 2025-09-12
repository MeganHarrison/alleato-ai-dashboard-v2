import { test, expect } from '@playwright/test';

test.describe('Authentication Protection', () => {
  test('should redirect unauthenticated users to login page', async ({ page }) => {
    // Test root page redirects to login
    await page.goto('http://localhost:3003/');
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Test projects dashboard redirects to login
    await page.goto('http://localhost:3003/projects-dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Test meetings page redirects to login
    await page.goto('http://localhost:3003/meetings');
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Test FM Global dashboard redirects to login
    await page.goto('http://localhost:3003/fm-global-dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should allow access to auth pages', async ({ page }) => {
    // Test login page is accessible
    await page.goto('http://localhost:3003/auth/login');
    await expect(page.getByText('Alleato Group')).toBeVisible();
    
    // Test sign-up page is accessible
    await page.goto('http://localhost:3003/auth/sign-up');
    await expect(page).toHaveURL(/\/auth\/sign-up/);
    
    // Test forgot password page is accessible
    await page.goto('http://localhost:3003/auth/forgot-password');
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });

  test('login page should have proper form elements', async ({ page }) => {
    await page.goto('http://localhost:3003/auth/login');
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});