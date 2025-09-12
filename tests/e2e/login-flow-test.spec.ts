import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  const baseUrl = 'http://localhost:3003';

  test('should show login form and handle form submission', async ({ page }) => {
    await page.goto(`${baseUrl}/auth/login`);
    
    // Take screenshot of login page
    await page.screenshot({ 
      path: 'screenshots/login-form.png',
      fullPage: true 
    });
    
    // Check form elements are present with specific selectors
    await expect(page.getByRole('heading', { name: 'Login to your account' })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
  });

  test('should attempt login with test credentials', async ({ page }) => {
    await page.goto(`${baseUrl}/auth/login`);
    
    // Fill in test credentials (will likely fail but we can test the form submission)
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('testpassword');
    
    // Submit the form
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    
    // Wait for either redirect to homepage or error message
    await page.waitForTimeout(3000);
    
    // Take screenshot of result
    await page.screenshot({ 
      path: 'screenshots/login-result.png',
      fullPage: true 
    });
    
    const currentUrl = page.url();
    console.log('Current URL after login attempt:', currentUrl);
    
    // The form should either show an error or redirect
    // Since we don't have a test user, we expect to stay on login page or see error
    const hasError = await page.locator('[class*="destructive"]').isVisible().catch(() => false);
    const isRedirected = currentUrl === `${baseUrl}/` || currentUrl.includes('localhost:3003/') && !currentUrl.includes('/auth/login');
    
    console.log('Has error:', hasError);
    console.log('Is redirected:', isRedirected);
    
    // At least one should be true (either error shown or redirected)
    expect(hasError || isRedirected).toBeTruthy();
  });
});