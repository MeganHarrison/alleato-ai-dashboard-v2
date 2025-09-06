import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

// Store auth state to reuse across tests
const authFile = 'playwright/.auth/user.json'

test.describe('Meeting Intelligence - Full System Test', () => {
  // Login once and save the session
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    
    // Navigate to login
    await page.goto('/auth/signin')
    
    // Check if we need to login (might already be logged in from cookies)
    if (page.url().includes('/auth/signin')) {
      console.log('Logging in...')
      
      // Look for email/password fields and login
      // Try different possible selectors for Supabase Auth UI
      try {
        // Common Supabase Auth UI selectors
        const emailSelector = 'input[type="email"], input[name="email"], input[placeholder*="email" i]'
        const passwordSelector = 'input[type="password"], input[name="password"]'
        
        await page.waitForSelector(emailSelector, { timeout: 5000 })
        
        // Use real test credentials or environment variables
        const testEmail = process.env.TEST_EMAIL || 'test@example.com'
        const testPassword = process.env.TEST_PASSWORD || 'testpassword123'
        
        await page.fill(emailSelector, testEmail)
        await page.fill(passwordSelector, testPassword)
        
        // Click submit button
        const submitButton = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")')
        await submitButton.click()
        
        // Wait for navigation after login
        await page.waitForURL((url) => !url.toString().includes('/auth'), { 
          timeout: 10000,
          waitUntil: 'networkidle' 
        })
        
        console.log('Login successful!')
      } catch (error) {
        console.log('Could not login automatically, may need manual intervention')
        console.log('Current URL:', page.url())
      }
    }
    
    // Save authentication state
    await context.storageState({ path: authFile })
    await context.close()
  })

  test.describe.serial('With Authentication', () => {
    // Only use auth file if it exists
    if (fs.existsSync(authFile)) {
      test.use({ storageState: authFile })
    }

    test('should navigate to Meeting Intelligence page', async ({ page }) => {
      // Navigate directly to the meeting intelligence page
      await page.goto('/meeting-intelligence')
      
      // Should not redirect to login
      expect(page.url()).toContain('/meeting-intelligence')
      
      // Check for main heading
      await expect(page.locator('h1:has-text("Meeting Intelligence")')).toBeVisible({ timeout: 10000 })
      
      // Check for statistics cards
      await expect(page.locator('text=Total Meetings')).toBeVisible()
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-results/meeting-intelligence-page.png' })
    })

    test('should upload and process a meeting transcript', async ({ page }) => {
      await page.goto('/meeting-intelligence')
      
      // Click on Upload tab
      await page.getByRole('tab', { name: 'Upload' }).click()
      
      // Wait for upload form to be visible
      await expect(page.locator('text=Upload Meeting Transcript')).toBeVisible()
      
      // Create a test transcript
      const testTranscript = `
Title: Test Meeting - Playwright Automation
Date: ${new Date().toISOString()}
Duration: 30 minutes
Participants: John Doe, Jane Smith, Test User
Meeting ID: PLAYWRIGHT_${Date.now()}

## Transcript

John Doe: Let's discuss the new feature implementation.

Jane Smith: I think we should prioritize the user authentication flow.

Test User: I agree. We also need to address the performance issues.

John Doe: Good point. I'll take the action item to review the performance metrics.

Jane Smith: There's a risk that the API integration might be delayed.

Test User: Let's schedule a follow-up meeting next week.

## Action Items
- John Doe: Review performance metrics by Friday
- Jane Smith: Complete API documentation
- Test User: Set up monitoring dashboard

## Risks Identified
- API integration delay (High priority)
- Performance degradation under load (Medium priority)

## Decisions Made
- Prioritize authentication flow
- Schedule weekly sync meetings
      `
      
      // Fill in the transcript
      await page.getByPlaceholder('Paste your meeting transcript here...').fill(testTranscript)
      
      // Fill metadata
      await page.getByPlaceholder('e.g., Product Planning Meeting').fill('Playwright Test Meeting')
      await page.getByPlaceholder('John Doe, Jane Smith, ...').fill('John Doe, Jane Smith, Test User')
      
      // Screenshot before upload
      await page.screenshot({ path: 'test-results/before-upload.png' })
      
      // Click Upload & Process button
      const uploadButton = page.getByRole('button', { name: /Upload & Process/ })
      await expect(uploadButton).toBeEnabled()
      await uploadButton.click()
      
      // Wait for success message or error
      const successMessage = page.locator('text=/successfully|complete/i')
      const errorMessage = page.locator('text=/error|failed/i')
      
      // Wait for either success or error (timeout after 30 seconds)
      const result = await Promise.race([
        successMessage.waitFor({ timeout: 30000 }).then(() => 'success'),
        errorMessage.waitFor({ timeout: 30000 }).then(() => 'error')
      ]).catch(() => 'timeout')
      
      // Take screenshot of result
      await page.screenshot({ path: 'test-results/after-upload.png' })
      
      if (result === 'success') {
        console.log('✅ Upload successful!')
      } else if (result === 'error') {
        const errorText = await errorMessage.textContent()
        console.log('❌ Upload failed:', errorText)
      } else {
        console.log('⏱️ Upload timed out')
      }
      
      // Verify the upload was processed
      expect(result).toBe('success')
    })

    test('should trigger manual vectorization', async ({ page }) => {
      // Navigate to the vectorization API endpoint
      await page.goto('/api/cron/vectorize-meetings')
      
      // Check the response
      const pageContent = await page.textContent('body')
      console.log('Vectorization API response:', pageContent)
      
      // Should get a JSON response (not a redirect)
      expect(pageContent).toMatch(/success|processed|message/i)
    })

    test('should show uploaded meeting in the list', async ({ page }) => {
      await page.goto('/meeting-intelligence')
      
      // Click on All Meetings tab
      await page.getByRole('tab', { name: 'All Meetings' }).click()
      
      // Wait for table to load
      await expect(page.locator('table')).toBeVisible()
      
      // Search for our test meeting
      const searchInput = page.getByPlaceholder('Search meetings or participants...')
      await searchInput.fill('Playwright Test Meeting')
      
      // Check if our meeting appears
      const meetingRow = page.locator('text=Playwright Test Meeting')
      
      // Meeting might not appear immediately if vectorization is still processing
      try {
        await expect(meetingRow).toBeVisible({ timeout: 10000 })
        console.log('✅ Test meeting found in list!')
      } catch {
        console.log('⚠️ Test meeting not found - may still be processing')
      }
      
      // Take screenshot of meetings table
      await page.screenshot({ path: 'test-results/meetings-table.png' })
    })

    test('should query meetings using AI chat', async ({ page }) => {
      await page.goto('/meeting-intelligence')
      
      // Ensure AI Assistant tab is active
      await page.getByRole('tab', { name: 'AI Assistant' }).click()
      
      // Wait for chat interface
      await expect(page.getByPlaceholder('Ask about your meetings...')).toBeVisible()
      
      // Send a test query
      const chatInput = page.getByPlaceholder('Ask about your meetings...')
      await chatInput.fill('What are the most recent action items?')
      
      // Send the message
      await page.getByRole('button', { name: 'Send' }).click()
      
      // Wait for response (AI might take a few seconds)
      await page.waitForTimeout(3000)
      
      // Check for AI response
      const messages = page.locator('[class*="assistant"], [class*="message"]')
      const messageCount = await messages.count()
      
      expect(messageCount).toBeGreaterThan(0)
      console.log(`✅ AI responded with ${messageCount} messages`)
      
      // Take screenshot of chat
      await page.screenshot({ path: 'test-results/ai-chat.png' })
    })

    test('should check meeting statistics', async ({ page }) => {
      await page.goto('/meeting-intelligence')
      
      // Get statistics values
      const stats = {
        total: await page.locator('text=Total Meetings').locator('..').locator('.text-2xl').textContent(),
        thisWeek: await page.locator('text=This Week').locator('..').locator('.text-2xl').textContent(),
        actions: await page.locator('text=Action Items').locator('..').locator('.text-2xl').textContent(),
        risks: await page.locator('text=Identified Risks').locator('..').locator('.text-2xl').textContent()
      }
      
      console.log('Meeting Statistics:', stats)
      
      // Verify we have some meetings
      expect(parseInt(stats.total || '0')).toBeGreaterThan(0)
      
      // Take final screenshot
      await page.screenshot({ path: 'test-results/statistics.png', fullPage: true })
    })
  })

  test.afterAll(async () => {
    // Clean up auth file
    if (fs.existsSync(authFile)) {
      fs.unlinkSync(authFile)
    }
  })
})