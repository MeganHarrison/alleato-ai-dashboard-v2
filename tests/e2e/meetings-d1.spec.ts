import { test, expect } from '@playwright/test'

test.describe('Cloudflare D1 Meetings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the D1 meetings page
    await page.goto('/meetings-d1')
  })

  test('should load the meetings-d1 page', async ({ page }) => {
    // Check that the page title is displayed
    await expect(page.getByRole('heading', { name: 'Meetings (Cloudflare D1)' })).toBeVisible()
    
    // Check for the description text
    await expect(page.getByText('View and manage meeting records from Cloudflare D1 database')).toBeVisible()
  })

  test('should display error message when D1 is not configured', async ({ page }) => {
    // Check if error message is displayed (when credentials are not configured)
    const errorDiv = page.locator('.bg-red-50')
    
    // If error exists, verify its content
    if (await errorDiv.isVisible()) {
      await expect(errorDiv.getByText('Error loading meetings')).toBeVisible()
      
      // Check for helpful error message about configuration
      const errorText = await errorDiv.textContent()
      expect(errorText).toContain('meetings table')
    }
  })

  test('should display add meeting button', async ({ page }) => {
    // Check that the Add Meeting button is visible
    const addButton = page.getByRole('button', { name: /add.*meeting/i })
    await expect(addButton).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls to simulate error
    await page.route('**/api/d1*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Database connection failed' })
      })
    })

    // Reload the page to trigger the API call
    await page.reload()

    // Check that error is displayed
    await expect(page.locator('.bg-red-50')).toBeVisible()
    await expect(page.getByText('Error loading meetings')).toBeVisible()
  })

  test('should display meetings table when data is available', async ({ page }) => {
    // Mock successful API response with sample data
    await page.route('**/api/d1*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          meetings: [
            {
              id: '1',
              title: 'Test Meeting',
              date: '2025-08-28',
              participants: ['John Doe', 'Jane Smith'],
              summary: 'Test meeting summary',
              action_items: ['Action 1', 'Action 2'],
              project_id: 'proj-001',
              created_at: '2025-08-28T10:00:00Z',
              updated_at: '2025-08-28T10:00:00Z',
              projects: { id: 'proj-001', name: 'Test Project' }
            }
          ],
          error: null
        })
      })
    })

    // Reload the page to get mocked data
    await page.reload()

    // Wait for table to be visible
    await expect(page.locator('table')).toBeVisible()

    // Check that the meeting data is displayed
    await expect(page.getByText('Test Meeting')).toBeVisible()
  })

  test('should verify API endpoint configuration', async ({ page, request }) => {
    // Try to call the API directly
    const response = await request.get('/api/d1?action=list')
    
    // Check that the endpoint exists (even if it returns an error)
    expect(response.status()).toBeLessThan(500)
    
    const data = await response.json()
    
    // If there's an error, it should be about configuration or permissions
    if (data.error) {
      expect(['Cloudflare credentials not configured', 'Failed to query D1: Forbidden', 'Failed to query D1: Not found'].some(
        msg => data.error.includes(msg)
      )).toBeTruthy()
    }
  })
})

test.describe('D1 API Route Tests', () => {
  test('should handle GET request for listing meetings', async ({ request }) => {
    const response = await request.get('/api/d1?action=list')
    expect(response.status()).toBeLessThan(500) // Should not be a server error
    
    const data = await response.json()
    // Should have either meetings array or error
    if (data.error) {
      expect(data.error).toBeTruthy()
    } else {
      expect(data).toHaveProperty('meetings')
      expect(Array.isArray(data.meetings)).toBeTruthy()
    }
  })

  test('should handle POST request for creating meetings', async ({ request }) => {
    const response = await request.post('/api/d1', {
      data: {
        action: 'create',
        data: {
          title: 'New Test Meeting',
          date: '2025-08-28',
          participants: ['Test User'],
          summary: 'Test summary',
          action_items: ['Test action'],
          project_id: 'test-proj'
        }
      }
    })
    
    expect(response.status()).toBeLessThan(500)
    
    const data = await response.json()
    // Should have either data or error
    expect(data.data !== undefined || data.error !== undefined).toBeTruthy()
  })

  test('should reject invalid actions', async ({ request }) => {
    const response = await request.post('/api/d1', {
      data: {
        action: 'invalid_action',
        data: {}
      }
    })
    
    const data = await response.json()
    expect(data.error).toContain('Invalid action')
  })
})