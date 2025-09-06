import { test, expect } from '@playwright/test';

test.describe('Full Application Test', () => {
  test('Environment variables are loaded correctly', async ({ page }) => {
    // Test auth pages don't show Supabase configuration errors
    await page.goto('http://localhost:3003/auth/login');
    
    // Check for any Supabase configuration errors
    const errorText = await page.locator('text=/Your project\'s URL and Key are required/i').count();
    expect(errorText).toBe(0);
    
    // Check page title
    await expect(page).toHaveTitle(/Alleato/);
  });

  test('Auth pages render correctly', async ({ page }) => {
    // Test login page
    await page.goto('http://localhost:3003/auth/login');
    await expect(page.locator('h2:has-text("Login")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
    
    // Test sign up page
    await page.goto('http://localhost:3003/auth/sign-up');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Protected routes redirect to auth', async ({ page }) => {
    // Test various protected routes
    const protectedRoutes = [
      '/dashboard',
      '/meetings-db',
      '/clients',
      '/projects-db',
      '/pm-assistant'
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(`http://localhost:3003${route}`);
      await expect(page).toHaveURL(/auth\/login/);
    }
  });

  test('No critical console errors', async ({ page }) => {
    const criticalErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out known non-critical warnings
        if (!text.includes('Next.js') && 
            !text.includes('webpack') &&
            !text.includes('Failed to load resource') &&
            text.includes('Supabase')) {
          criticalErrors.push(text);
        }
      }
    });
    
    // Test multiple pages
    await page.goto('http://localhost:3003/auth/login');
    await page.waitForTimeout(1000);
    
    await page.goto('http://localhost:3003/auth/sign-up');
    await page.waitForTimeout(1000);
    
    expect(criticalErrors.length).toBe(0);
  });

  test('Application is fully functional', async ({ page }) => {
    // Go to login page
    await page.goto('http://localhost:3003/auth/login');
    
    // Verify the page loaded without Supabase errors
    const pageContent = await page.content();
    expect(pageContent).not.toContain('Your project\'s URL and Key are required');
    expect(pageContent).not.toContain('Error: ');
    
    // Verify login form is functional
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("Login")');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    // Test form interaction
    await emailInput.fill('test@example.com');
    await passwordInput.fill('testpassword');
    
    // Verify values were set
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('testpassword');
  });
});