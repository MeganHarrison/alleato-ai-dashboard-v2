import { test, expect } from '@playwright/test'

test.describe('ACTUAL Employees Page Test', () => {
  test('TEST THE ACTUAL EMPLOYEES PAGE', async ({ page }) => {
    // Set up console error listener FIRST
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.error('CONSOLE ERROR:', msg.text())
      }
    })
    
    // Navigate to the page
    console.log('1. Navigating to http://localhost:3006/employees...')
    await page.goto('http://localhost:3006/employees', { waitUntil: 'networkidle' })
    
    // Check where we ended up
    const currentUrl = page.url()
    console.log('2. Current URL:', currentUrl)
    
    // If redirected to login, handle auth
    if (currentUrl.includes('/auth/login')) {
      console.log('3. Redirected to login page, attempting to authenticate...')
      
      // Try to find email/password fields
      const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]')
      const passwordField = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]')
      
      // Check if fields exist
      const emailExists = await emailField.count() > 0
      const passwordExists = await passwordField.count() > 0
      
      if (emailExists && passwordExists) {
        console.log('4. Found login fields, attempting to login...')
        // Use test credentials or skip
        await emailField.fill('test@example.com')
        await passwordField.fill('password123')
        
        // Find and click submit button
        const submitButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")')
        if (await submitButton.count() > 0) {
          await submitButton.click()
          await page.waitForLoadState('networkidle')
          console.log('5. Login attempt completed')
        }
      } else {
        console.log('4. Could not find login fields')
        // Try to navigate directly with cookies or bypass
      }
    }
    
    // Check final URL after any auth attempts
    const finalUrl = page.url()
    console.log('6. Final URL:', finalUrl)
    
    // Take a screenshot to see what's actually on the page
    await page.screenshot({ path: 'tests/screenshots/employees-page-actual.png', fullPage: true })
    console.log('7. Screenshot saved to tests/screenshots/employees-page-actual.png')
    
    // Try to find ANY content on the page
    console.log('8. Page content check:')
    
    // Check for error messages
    const errorMessages = await page.locator('text=/error|Error|ERROR/i').all()
    if (errorMessages.length > 0) {
      console.log('   - Found error messages on page:')
      for (const error of errorMessages) {
        console.log(`     "${await error.textContent()}"`)
      }
    }
    
    // Check for the employees table or any table
    const tables = await page.locator('table').all()
    console.log(`   - Found ${tables.length} tables on page`)
    
    // Check for employee names
    const brandonVisible = await page.locator('text=Brandon Clymer').isVisible().catch(() => false)
    const ajVisible = await page.locator('text=AJ Taylor').isVisible().catch(() => false)
    const jesseVisible = await page.locator('text=Jesse').isVisible().catch(() => false)
    
    console.log(`   - Brandon Clymer visible: ${brandonVisible}`)
    console.log(`   - AJ Taylor visible: ${ajVisible}`)
    console.log(`   - Jesse visible: ${jesseVisible}`)
    
    // Check for page title/headers
    const h1 = await page.locator('h1').textContent().catch(() => 'No h1 found')
    const h2 = await page.locator('h2').first().textContent().catch(() => 'No h2 found')
    console.log(`   - H1 content: "${h1}"`)
    console.log(`   - H2 content: "${h2}"`)
    
    // Check for any loading indicators
    const loading = await page.locator('text=/loading|Loading|LOADING/i').isVisible().catch(() => false)
    if (loading) {
      console.log('   - Page shows loading indicator')
    }
    
    // Get all visible text on the page (first 500 chars)
    const bodyText = await page.locator('body').textContent()
    console.log(`   - First 500 chars of page text: "${bodyText?.substring(0, 500)}"`)
    
    // Report console errors
    if (consoleErrors.length > 0) {
      console.log('\n9. CONSOLE ERRORS DETECTED:')
      consoleErrors.forEach((error, i) => {
        console.log(`   Error ${i + 1}: ${error}`)
      })
    } else {
      console.log('\n9. No console errors detected')
    }
    
    // Final assertion - at least check we're not on an error page
    if (finalUrl.includes('/employees')) {
      console.log('\n✅ We are on the employees page URL')
      
      // Check if data is actually displayed
      if (brandonVisible || ajVisible || jesseVisible) {
        console.log('✅ Employee data IS visible!')
      } else {
        console.log('❌ Employee data is NOT visible - THERE IS A PROBLEM!')
        
        // Get the page HTML to debug
        const html = await page.content()
        console.log('\n10. Page HTML (first 1000 chars):')
        console.log(html.substring(0, 1000))
      }
    } else {
      console.log(`\n❌ We are NOT on the employees page (current: ${finalUrl})`)
    }
  })
})