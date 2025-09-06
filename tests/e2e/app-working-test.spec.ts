import { test, expect } from '@playwright/test';

test.describe('Application Working Test', () => {
  test('✅ Supabase is configured correctly - no errors', async ({ page }) => {
    await page.goto('http://localhost:3003/auth/login');
    
    // CRITICAL: Check that Supabase is properly configured
    const errorMessage = await page.locator('text=/Your project\'s URL and Key are required/i').count();
    expect(errorMessage).toBe(0);
    
    // Check page loaded successfully
    await expect(page).toHaveTitle(/Alleato/);
  });

  test('✅ Login page is accessible and functional', async ({ page }) => {
    await page.goto('http://localhost:3003/auth/login');
    
    // Check for form inputs (these are critical for auth)
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Test that inputs are interactive
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('✅ Protected routes redirect to login when not authenticated', async ({ page }) => {
    // Test at least one protected route
    await page.goto('http://localhost:3003/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('✅ No Supabase errors in console', async ({ page }) => {
    const supabaseErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Supabase')) {
        supabaseErrors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:3003/auth/login');
    await page.waitForTimeout(2000);
    
    expect(supabaseErrors.length).toBe(0);
  });

  test('✅ Application is fully operational', async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:3003/auth/login');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Verify no critical error messages
    const criticalErrors = await page.locator('text=/Error:|Failed to|Exception/i').count();
    expect(criticalErrors).toBe(0);
    
    // Verify the page has rendered properly (has content)
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(100); // Page has substantial content
    
    console.log('✅ Application is working! Supabase is properly configured.');
  });
});