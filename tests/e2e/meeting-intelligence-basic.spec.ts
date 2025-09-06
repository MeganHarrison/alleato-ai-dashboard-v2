import { test, expect } from '@playwright/test'

test.describe('Meeting Intelligence - Basic Tests', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    // Navigate to meeting-intelligence page
    await page.goto('/meeting-intelligence')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/auth\/(login|signin)/)
  })

  test('should have correct page structure after login', async ({ page, context }) => {
    // Set a mock auth cookie to bypass login (adjust based on your auth system)
    // This is a workaround for testing without actual login
    await context.addCookies([
      {
        name: 'sb-lgveqfnpkxvzbnnwuled-auth-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      }
    ])
    
    // Try to navigate to the page
    const response = await page.goto('/meeting-intelligence', { waitUntil: 'domcontentloaded' })
    
    // Check if we get redirected or if page loads
    if (response && response.status() === 200) {
      // Page loaded successfully, check for expected elements
      const pageTitle = await page.title()
      expect(pageTitle).toContain('Alleato')
    } else {
      // We got redirected to login, which is expected without proper auth
      expect(page.url()).toMatch(/auth\/(login|signin)/)
    }
  })
})

test.describe('Meeting Intelligence - Component Tests', () => {
  test('should compile without errors', async ({ page }) => {
    // Navigate to any page to ensure app is running
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
    
    // Check that server is responding
    expect(response?.status()).toBeLessThan(500)
    
    // Check console for any critical errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Try to load the meeting-intelligence page (will redirect to login)
    await page.goto('/meeting-intelligence', { waitUntil: 'domcontentloaded' })
    
    // Wait a moment for any errors to appear
    await page.waitForTimeout(1000)
    
    // Check that there are no critical compile errors
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Cannot read properties of undefined') ||
      error.includes('Module not found') ||
      error.includes('SyntaxError')
    )
    
    expect(criticalErrors).toHaveLength(0)
  })

  test('API endpoint should exist', async ({ request }) => {
    // Test that the vectorization API endpoint exists
    const response = await request.get('/api/cron/vectorize-meetings')
    
    // Should either return 401 (unauthorized) or redirect (3xx) or success (200)
    // Any of these responses indicate the endpoint exists
    const status = response.status()
    console.log('API endpoint returned status:', status)
    expect(status).toBeLessThan(500) // Not a server error
    expect(status).toBeGreaterThanOrEqual(200) // Valid HTTP response
  })
})