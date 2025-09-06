import { test, expect } from '@playwright/test'

test.describe('Test Employees Page - No Auth Required', () => {
  test('Verify employees component and data loading works', async ({ page }) => {
    console.log('=== TESTING EMPLOYEES COMPONENT WITHOUT AUTH ===\n')
    
    // Track console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        consoleErrors.push(text)
        console.error('Console error:', text)
      }
    })
    
    // Navigate directly to test page (no auth required)
    console.log('1. Navigating to test page...')
    await page.goto('http://localhost:3006/test-employees')
    await page.waitForLoadState('networkidle')
    
    // Check URL
    const url = page.url()
    console.log('   Current URL:', url)
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/test-employees-page.png', fullPage: true })
    console.log('   Screenshot saved\n')
    
    // Check for warning banner
    console.log('2. Checking page elements...')
    const warningBanner = await page.locator('text=/TEST PAGE/').isVisible()
    console.log(`   Test warning banner: ${warningBanner ? '✅' : '❌'}`)
    
    // Check for error messages
    const errorBox = await page.locator('text=/Error Loading Employees/').isVisible()
    if (errorBox) {
      const errorText = await page.locator('.bg-red-100, .bg-red-900').textContent()
      console.log(`   ❌ ERROR FOUND: ${errorText}`)
    } else {
      console.log('   No errors displayed ✅')
    }
    
    // Check for debug info
    const debugInfo = await page.locator('text=/Debug Info/').isVisible()
    console.log(`   Debug info section: ${debugInfo ? '✅' : '❌'}`)
    
    if (debugInfo) {
      const employeeCount = await page.locator('text=/Number of employees loaded/').textContent()
      console.log(`   ${employeeCount}`)
    }
    
    // Check for table
    console.log('\n3. Checking for employees table...')
    const tableExists = await page.locator('table').count() > 0
    console.log(`   Table exists: ${tableExists ? '✅' : '❌'}`)
    
    if (tableExists) {
      // Check table headers
      const headers = await page.locator('table thead th').allTextContents()
      console.log('   Table headers:', headers.join(', '))
      
      // Count rows
      const rowCount = await page.locator('table tbody tr').count()
      console.log(`   Table rows: ${rowCount}`)
      
      // Check for specific employees
      console.log('\n4. Checking for employee data...')
      const employees = [
        'Brandon Clymer',
        'AJ Taylor',
        'Jesse'
      ]
      
      for (const name of employees) {
        const visible = await page.locator(`text="${name}"`).isVisible().catch(() => false)
        console.log(`   ${name}: ${visible ? '✅ Found' : '❌ Not found'}`)
      }
      
      // Check for departments
      const leadership = await page.locator('text="Leadership"').count()
      const operations = await page.locator('text="Operations"').count()
      console.log(`   Leadership dept: ${leadership} occurrences`)
      console.log(`   Operations dept: ${operations} occurrences`)
      
      // Check for search functionality
      const searchBox = await page.locator('input[placeholder*="Search"]').isVisible()
      console.log(`   Search box: ${searchBox ? '✅' : '❌'}`)
      
      if (searchBox) {
        // Test search
        console.log('\n5. Testing search functionality...')
        await page.fill('input[placeholder*="Search"]', 'Brandon')
        await page.waitForTimeout(500)
        
        const brandonVisible = await page.locator('text="Brandon Clymer"').isVisible()
        const ajVisible = await page.locator('text="AJ Taylor"').isVisible()
        
        console.log(`   After searching "Brandon":`)
        console.log(`   - Brandon Clymer: ${brandonVisible ? '✅ Visible' : '❌ Hidden'}`)
        console.log(`   - AJ Taylor: ${ajVisible ? '❌ Visible (should be hidden)' : '✅ Hidden'}`)
      }
    } else {
      // No table, check what's on the page
      console.log('   ❌ No table found!')
      
      // Get page text
      const bodyText = await page.locator('body').textContent()
      console.log('\n   Page content (first 500 chars):')
      console.log('   ', bodyText?.substring(0, 500))
    }
    
    // Check raw data in debug section
    console.log('\n6. Checking raw data...')
    const detailsElement = await page.locator('details summary').isVisible()
    if (detailsElement) {
      await page.click('details summary')
      await page.waitForTimeout(500)
      
      const rawData = await page.locator('pre').textContent()
      if (rawData) {
        try {
          const data = JSON.parse(rawData)
          console.log(`   Raw data contains ${data.length} employees`)
          if (data.length > 0) {
            console.log(`   First employee: ${data[0].first_name} ${data[0].last_name}`)
          }
        } catch (e) {
          console.log('   Could not parse raw data')
        }
      }
    }
    
    // Report console errors
    if (consoleErrors.length > 0) {
      console.log('\n7. Console errors detected:')
      consoleErrors.forEach(err => console.log(`   - ${err}`))
    } else {
      console.log('\n7. No console errors ✅')
    }
    
    // Final assertions
    console.log('\n=== TEST SUMMARY ===')
    
    // Should be on test page
    expect(page.url()).toContain('/test-employees')
    
    // Should have warning banner
    await expect(page.locator('text=/TEST PAGE/')).toBeVisible()
    
    // Should have either table with data OR error message
    const hasTable = await page.locator('table').count() > 0
    const hasError = await page.locator('text=/Error Loading Employees/').isVisible()
    
    if (hasError) {
      console.log('❌ Error loading employees - check database connection')
    } else if (hasTable) {
      console.log('✅ Table displayed successfully')
      const rowCount = await page.locator('table tbody tr').count()
      if (rowCount > 0 && !await page.locator('text=/No employees found/').isVisible()) {
        console.log(`✅ ${rowCount} employees displayed`)
      } else {
        console.log('⚠️  Table exists but no employees shown')
      }
    } else {
      console.log('❌ No table and no error - unexpected state')
    }
  })
})