import { test, expect } from '@playwright/test'

test.describe('Meeting Intelligence System', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth/signin')
    
    // Check if already logged in by looking for redirect
    const url = page.url()
    if (!url.includes('/auth/signin')) {
      // Already logged in, navigate to meeting intelligence
      await page.goto('/meeting-intelligence')
    } else {
      // Perform login if needed
      // Note: You may need to adjust selectors based on your auth UI
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'testpassword')
      await page.click('button[type="submit"]')
      await page.waitForURL('**/meeting-intelligence', { timeout: 10000 })
    }
  })

  test('should load Meeting Intelligence page', async ({ page }) => {
    await page.goto('/meeting-intelligence')
    
    // Check page title
    await expect(page).toHaveTitle(/Meeting Intelligence/)
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Meeting Intelligence')
    
    // Check for tabs
    await expect(page.getByRole('tab', { name: 'AI Assistant' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'All Meetings' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Upload' })).toBeVisible()
  })

  test('should display statistics cards', async ({ page }) => {
    await page.goto('/meeting-intelligence')
    
    // Check for statistics cards
    await expect(page.locator('text=Total Meetings')).toBeVisible()
    await expect(page.locator('text=This Week')).toBeVisible()
    await expect(page.locator('text=Action Items')).toBeVisible()
    await expect(page.locator('text=Identified Risks')).toBeVisible()
  })

  test('should show AI chat interface', async ({ page }) => {
    await page.goto('/meeting-intelligence')
    
    // Ensure AI Assistant tab is active
    await page.getByRole('tab', { name: 'AI Assistant' }).click()
    
    // Check for chat components
    await expect(page.locator('text=Meeting Intelligence Assistant')).toBeVisible()
    await expect(page.getByPlaceholder('Ask about your meetings...')).toBeVisible()
    
    // Check for welcome message
    await expect(page.locator('text=/I\'m your Meeting Intelligence Assistant/')).toBeVisible()
  })

  test('should switch to meetings table', async ({ page }) => {
    await page.goto('/meeting-intelligence')
    
    // Click on All Meetings tab
    await page.getByRole('tab', { name: 'All Meetings' }).click()
    
    // Check for table headers
    await expect(page.getByRole('columnheader', { name: 'Meeting' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Date & Time' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Participants' })).toBeVisible()
  })

  test('should show upload interface', async ({ page }) => {
    await page.goto('/meeting-intelligence')
    
    // Click on Upload tab
    await page.getByRole('tab', { name: 'Upload' }).click()
    
    // Check for upload components
    await expect(page.locator('text=Upload Meeting Transcript')).toBeVisible()
    await expect(page.locator('input[type="file"]')).toBeVisible()
    await expect(page.getByPlaceholder('Paste your meeting transcript here...')).toBeVisible()
    await expect(page.getByRole('button', { name: /Upload & Process/ })).toBeVisible()
  })

  test('should allow searching meetings', async ({ page }) => {
    await page.goto('/meeting-intelligence')
    
    // Switch to meetings tab
    await page.getByRole('tab', { name: 'All Meetings' }).click()
    
    // Check for search input
    const searchInput = page.getByPlaceholder('Search meetings or participants...')
    await expect(searchInput).toBeVisible()
    
    // Try searching
    await searchInput.fill('test search')
    
    // Check that search input accepts text
    await expect(searchInput).toHaveValue('test search')
  })

  test('should send chat message to AI assistant', async ({ page }) => {
    await page.goto('/meeting-intelligence')
    
    // Ensure AI Assistant tab is active
    await page.getByRole('tab', { name: 'AI Assistant' }).click()
    
    // Type a message
    const chatInput = page.getByPlaceholder('Ask about your meetings...')
    await chatInput.fill('What action items are pending?')
    
    // Send message
    await page.getByRole('button', { name: 'Send' }).click()
    
    // Check that message was sent (input should clear)
    await expect(chatInput).toHaveValue('')
    
    // Check for user message in chat
    await expect(page.locator('text=What action items are pending?')).toBeVisible()
  })

  test('should validate upload form', async ({ page }) => {
    await page.goto('/meeting-intelligence')
    
    // Click on Upload tab
    await page.getByRole('tab', { name: 'Upload' }).click()
    
    // Try to upload without selecting file or entering text
    const uploadButton = page.getByRole('button', { name: /Upload & Process/ })
    
    // Button should be disabled when no file or text
    await expect(uploadButton).toBeDisabled()
    
    // Add some text to transcript field
    await page.getByPlaceholder('Paste your meeting transcript here...').fill('Test transcript content')
    
    // Button should now be enabled
    await expect(uploadButton).toBeEnabled()
  })

  test('should display meeting metadata fields', async ({ page }) => {
    await page.goto('/meeting-intelligence')
    
    // Click on Upload tab
    await page.getByRole('tab', { name: 'Upload' }).click()
    
    // Check for metadata input fields
    await expect(page.getByPlaceholder('e.g., Product Planning Meeting')).toBeVisible()
    await expect(page.getByPlaceholder('e.g., FF123456')).toBeVisible()
    await expect(page.getByPlaceholder('https://app.fireflies.ai/...')).toBeVisible()
    await expect(page.getByPlaceholder('John Doe, Jane Smith, ...')).toBeVisible()
  })
})

test.describe('Meeting Intelligence API', () => {
  test('should check vectorization endpoint', async ({ request }) => {
    // This will fail with 401 if not authenticated, which is expected
    const response = await request.get('/api/cron/vectorize-meetings')
    
    // Should either redirect to login or return 401
    expect([307, 401]).toContain(response.status())
  })
})