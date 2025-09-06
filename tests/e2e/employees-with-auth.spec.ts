import { test, expect } from '@playwright/test'

// You'll need to set these as environment variables or update with real credentials
const TEST_EMAIL = process.env.TEST_EMAIL || 'user@example.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password'

test.describe('Employees Page - With Authentication', () => {
  test('Login and verify employees page displays data', async ({ page }) => {
    console.log('=== STARTING EMPLOYEES PAGE TEST WITH AUTH ===\n')
    
    // Track console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.error('Console error:', msg.text())
      }
    })
    
    // Step 1: Go to login page
    console.log('1. Navigating to login page...')
    await page.goto('http://localhost:3006/auth/login')
    await expect(page).toHaveURL(/auth\/login/)
    
    // Take screenshot of login page
    await page.screenshot({ path: 'tests/screenshots/1-login-page.png' })
    
    // Step 2: Fill in login form
    console.log('2. Filling login form...')
    console.log(`   Email: ${TEST_EMAIL}`)
    
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    
    // Step 3: Click login button
    console.log('3. Clicking login button...')
    await page.click('button:has-text("Login")')
    
    // Wait for navigation or error
    await page.waitForLoadState('networkidle')
    
    // Check if we're still on login page (login failed)
    const currentUrl = page.url()
    if (currentUrl.includes('/auth/login')) {
      console.log('❌ Login failed - still on login page')
      console.log('   Current URL:', currentUrl)
      
      // Check for error messages
      const errorText = await page.locator('text=/invalid|error|failed/i').first().textContent().catch(() => null)
      if (errorText) {
        console.log('   Error message:', errorText)
      }
      
      await page.screenshot({ path: 'tests/screenshots/login-failed.png' })
      console.log('\n⚠️  NOTE: You need to set valid credentials!')
      console.log('   Either:')
      console.log('   1. Set TEST_EMAIL and TEST_PASSWORD environment variables')
      console.log('   2. Update the credentials in this test file')
      console.log('   3. Create a test user in Supabase')
      
      // Try to continue anyway to see what happens
    } else {
      console.log('✅ Login successful!')
      console.log('   Current URL:', currentUrl)
    }
    
    // Step 4: Navigate to employees page
    console.log('\n4. Navigating to employees page...')
    await page.goto('http://localhost:3006/employees')
    await page.waitForLoadState('networkidle')
    
    const employeesUrl = page.url()
    console.log('   Current URL:', employeesUrl)
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/2-employees-page.png', fullPage: true })
    
    // Step 5: Check what's on the page
    console.log('\n5. Checking page content...')
    
    // Check if we're on the employees page
    if (!employeesUrl.includes('/employees')) {
      console.log('❌ Not on employees page, redirected to:', employeesUrl)
      
      // Get page text to debug
      const pageText = await page.locator('body').textContent()
      console.log('   Page contains:', pageText?.substring(0, 200))
      
      throw new Error('Failed to reach employees page')
    }
    
    console.log('✅ On employees page')
    
    // Check for page elements
    const pageTitle = await page.locator('h2, h1').first().textContent().catch(() => 'No title found')
    console.log('   Page title:', pageTitle)
    
    // Check for table
    const tableExists = await page.locator('table').count() > 0
    console.log(`   Table exists: ${tableExists}`)
    
    if (tableExists) {
      // Count table rows
      const rowCount = await page.locator('table tbody tr').count()
      console.log(`   Table rows: ${rowCount}`)
      
      // Check for employee names
      const employees = [
        { name: 'Brandon Clymer', found: false },
        { name: 'AJ Taylor', found: false },
        { name: 'Jesse', found: false }
      ]
      
      for (const emp of employees) {
        emp.found = await page.locator(`text="${emp.name}"`).isVisible().catch(() => false)
        console.log(`   ${emp.name}: ${emp.found ? '✅ Found' : '❌ Not found'}`)
      }
      
      // Check for departments
      const deptLeadership = await page.locator('text="Leadership"').count()
      const deptOperations = await page.locator('text="Operations"').count()
      console.log(`   Leadership dept: ${deptLeadership} occurrences`)
      console.log(`   Operations dept: ${deptOperations} occurrences`)
      
      // Check for search box
      const searchBox = await page.locator('input[placeholder*="Search"]').count() > 0
      console.log(`   Search box: ${searchBox ? '✅' : '❌'}`)
      
    } else {
      console.log('❌ No table found on page')
      
      // Check for any error messages
      const errors = await page.locator('text=/error|Error|ERROR/i').all()
      if (errors.length > 0) {
        console.log('   Found error messages:')
        for (const error of errors) {
          console.log(`     - "${await error.textContent()}"`)
        }
      }
      
      // Get the entire page text to debug
      const pageText = await page.locator('body').textContent()
      console.log('\n   Full page text (first 1000 chars):')
      console.log(pageText?.substring(0, 1000))
    }
    
    // Step 6: Report console errors
    if (consoleErrors.length > 0) {
      console.log('\n6. Console errors found:')
      consoleErrors.forEach(err => console.log(`   - ${err}`))
    } else {
      console.log('\n6. No console errors')
    }
    
    // Final assertions
    await expect(page).toHaveURL(/employees/)
    
    // The table should exist
    await expect(page.locator('table')).toBeVisible()
    
    // At least one employee should be visible
    const anyEmployeeVisible = 
      await page.locator('text="Brandon Clymer"').isVisible().catch(() => false) ||
      await page.locator('text="AJ Taylor"').isVisible().catch(() => false) ||
      await page.locator('text="Jesse"').isVisible().catch(() => false)
    
    expect(anyEmployeeVisible).toBe(true)
    
    console.log('\n✅ TEST COMPLETED SUCCESSFULLY!')
  })
})