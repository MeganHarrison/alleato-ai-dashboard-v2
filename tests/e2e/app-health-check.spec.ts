import { test, expect } from '@playwright/test';

test.describe('Application Health Check', () => {
  test('Auth pages load without errors', async ({ page }) => {
    // Test login page
    await page.goto('http://localhost:3003/auth/login');
    await expect(page).toHaveTitle(/Alleato/);
    
    // Check for Supabase errors
    const errorMessage = page.locator('text=/Your project\'s URL and Key are required/i');
    await expect(errorMessage).not.toBeVisible();
    
    // Check login form exists
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Log in")')).toBeVisible();
  });

  test('Can navigate to sign up page', async ({ page }) => {
    await page.goto('http://localhost:3003/auth/sign-up');
    
    // Check for Supabase errors
    const errorMessage = page.locator('text=/Your project\'s URL and Key are required/i');
    await expect(errorMessage).not.toBeVisible();
    
    // Check sign up form exists
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('Protected routes redirect to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('http://localhost:3003/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*auth\/login/);
    
    // Check for Supabase errors
    const errorMessage = page.locator('text=/Your project\'s URL and Key are required/i');
    await expect(errorMessage).not.toBeVisible();
  });

  test('No console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:3003/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Filter out expected warnings (Next.js dev mode warnings)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Next.js') && 
      !error.includes('webpack') &&
      !error.includes('Failed to load resource') &&
      !error.includes('Supabase client')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});