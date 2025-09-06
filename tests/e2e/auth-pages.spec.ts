import { test, expect } from '@playwright/test'

test.describe('Authentication Pages', () => {
  test('Sign In page loads and is functional', async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/auth/signin')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check that the page loaded successfully
    await expect(page).toHaveTitle(/Alleato/)
    
    // Verify key elements are present
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.getByText('Sign In').first()).toBeVisible()
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByText("Don't have an account?")).toBeVisible()
    
    // Test form interaction
    await page.getByPlaceholder('Enter your email').fill('test@example.com')
    await page.getByPlaceholder('Enter your password').fill('TestPassword123!')
    
    // Test password visibility toggle
    const passwordInput = page.getByPlaceholder('Enter your password')
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click eye icon to show password
    await page.getByRole('button').filter({ has: page.locator('svg') }).last().click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Take screenshot of sign in page
    await page.screenshot({ 
      path: 'tests/screenshots/auth-signin-page.png',
      fullPage: true 
    })
    
    console.log('✅ Sign In page screenshot saved: tests/screenshots/auth-signin-page.png')
  })

  test('Sign Up page loads and is functional', async ({ page }) => {
    // Navigate to sign up page
    await page.goto('/auth/signup')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check that the page loaded successfully
    await expect(page).toHaveTitle(/Alleato/)
    
    // Verify key elements are present
    await expect(page.getByRole('heading', { name: 'Join Alleato AI' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible()
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible()
    await expect(page.getByPlaceholder('Create a password')).toBeVisible()
    await expect(page.getByPlaceholder('Confirm your password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible()
    await expect(page.getByText('Already have an account?')).toBeVisible()
    
    // Test form interaction
    await page.getByPlaceholder('Enter your email').fill('newuser@example.com')
    await page.getByPlaceholder('Create a password').fill('SecurePass123!')
    
    // Check password validation indicators appear
    await expect(page.getByText('At least 8 characters')).toBeVisible()
    await expect(page.getByText('One uppercase letter')).toBeVisible()
    await expect(page.getByText('One lowercase letter')).toBeVisible()
    await expect(page.getByText('One number')).toBeVisible()
    
    // Confirm password
    await page.getByPlaceholder('Confirm your password').fill('SecurePass123!')
    
    // Take screenshot of sign up page
    await page.screenshot({ 
      path: 'tests/screenshots/auth-signup-page.png',
      fullPage: true 
    })
    
    console.log('✅ Sign Up page screenshot saved: tests/screenshots/auth-signup-page.png')
  })

  test('Navigation between sign in and sign up works', async ({ page }) => {
    // Start at sign in page
    await page.goto('/auth/signin')
    await page.waitForLoadState('networkidle')
    
    // Click sign up link
    await page.getByRole('link', { name: 'Sign up' }).click()
    
    // Verify we're on sign up page
    await expect(page).toHaveURL(/\/auth\/signup/)
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible()
    
    // Click sign in link
    await page.getByRole('link', { name: 'Sign in' }).click()
    
    // Verify we're back on sign in page
    await expect(page).toHaveURL(/\/auth\/signin/)
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()
    
    console.log('✅ Navigation between auth pages works correctly')
  })

  test('Forgot password link is accessible', async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/auth/signin')
    await page.waitForLoadState('networkidle')
    
    // Check forgot password link exists
    const forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' })
    await expect(forgotPasswordLink).toBeVisible()
    
    // Click the link
    await forgotPasswordLink.click()
    
    // Verify navigation to forgot password page
    await expect(page).toHaveURL(/\/auth\/forgot-password/)
    
    console.log('✅ Forgot password link works correctly')
  })
})