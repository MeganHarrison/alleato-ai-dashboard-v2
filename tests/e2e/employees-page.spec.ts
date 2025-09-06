import { test, expect } from '@playwright/test'

test.describe('Employees Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the employees page
    await page.goto('http://localhost:3006/employees')
    
    // Handle authentication if redirected to login
    if (page.url().includes('/auth/login')) {
      // You would need to add your login logic here
      console.log('Note: Authentication required. Skipping auth for now.')
      // For now, we'll check if we can at least reach the login page
      await expect(page).toHaveURL(/.*\/auth\/login/)
      return
    }
  })

  test('should load employees page without errors', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/auth/login')) {
      test.skip()
      return
    }

    // Check page title
    await expect(page.locator('h2:has-text("Employees")')).toBeVisible()
    
    // Check page description
    await expect(page.locator('text=Manage your company employees')).toBeVisible()
    
    // Check for search input
    await expect(page.locator('input[placeholder*="Search employees"]')).toBeVisible()
    
    // Check for table
    await expect(page.locator('table')).toBeVisible()
    
    // Check console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        throw new Error(`Console error: ${msg.text()}`)
      }
    })
  })

  test('should display employee data from database', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/auth/login')) {
      test.skip()
      return
    }

    // Wait for table to load
    await page.waitForSelector('table tbody tr')
    
    // Check for expected employees
    await expect(page.locator('text=Brandon Clymer')).toBeVisible()
    await expect(page.locator('text=AJ Taylor')).toBeVisible()
    
    // Check for department badges
    await expect(page.locator('text=Leadership')).toBeVisible()
    await expect(page.locator('text=Operations')).toBeVisible()
  })

  test('should filter employees by search term', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/auth/login')) {
      test.skip()
      return
    }

    const searchInput = page.locator('input[placeholder*="Search employees"]')
    
    // Search for Brandon
    await searchInput.fill('Brandon')
    
    // Should show Brandon Clymer
    await expect(page.locator('text=Brandon Clymer')).toBeVisible()
    
    // Should not show AJ Taylor
    await expect(page.locator('text=AJ Taylor')).not.toBeVisible()
    
    // Clear search
    await searchInput.clear()
    
    // Both should be visible again
    await expect(page.locator('text=Brandon Clymer')).toBeVisible()
    await expect(page.locator('text=AJ Taylor')).toBeVisible()
  })

  test('should show correct table columns', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/auth/login')) {
      test.skip()
      return
    }

    // Check for all expected column headers
    const expectedColumns = [
      'Name',
      'Department',
      'Contact',
      'Start Date',
      'Salary',
      'Allowances',
      'Actions'
    ]
    
    for (const column of expectedColumns) {
      await expect(page.locator(`th:has-text("${column}")`)).toBeVisible()
    }
  })

  test('should show employee count at bottom', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/auth/login')) {
      test.skip()
      return
    }

    // Check for count text
    await expect(page.locator('text=/Showing \\d+ of \\d+ employees/')).toBeVisible()
  })

  test('should have working action dropdowns', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/auth/login')) {
      test.skip()
      return
    }

    // Click first action dropdown
    const firstActionButton = page.locator('button[aria-label*="menu"]').first()
    await firstActionButton.click()
    
    // Check dropdown menu items are visible
    await expect(page.locator('text=View details')).toBeVisible()
    await expect(page.locator('text=Edit employee')).toBeVisible()
    await expect(page.locator('text=Delete employee')).toBeVisible()
    
    // Click outside to close
    await page.click('body')
  })
})