import { test, expect } from '@playwright/test';

test.describe('Meetings System-wide Fix Verification', () => {
  test('Verify Tampa project (59) shows 4 meetings', async ({ page }) => {
    await page.goto('http://localhost:3001/projects/59');
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Verify project name
    await expect(page.locator('h1')).toContainText('Tampa Event/Party');
    
    // Wait for meetings section
    await page.waitForSelector('h2:text("Meetings")', { timeout: 10000 });
    
    // Verify meetings badge shows 4
    const badgeLocator = page.locator('h2:text("Meetings")').locator('..').locator('div').filter({ hasText: /^\d+$/ });
    await expect(badgeLocator).toContainText('4');
    
    // Take screenshot
    await page.screenshot({ 
      path: 'screenshots/tampa-project-59-4-meetings.png',
      fullPage: true 
    });
    
    console.log('✅ Tampa project shows 4 meetings correctly');
  });

  test('Verify Goodwill project (47) shows 80 meetings', async ({ page }) => {
    await page.goto('http://localhost:3001/projects/47');
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Verify project name
    await expect(page.locator('h1')).toContainText('Goodwill Bloomington');
    
    // Wait for meetings section
    await page.waitForSelector('h2:text("Meetings")', { timeout: 10000 });
    
    // Verify meetings badge shows 80
    const badgeLocator = page.locator('h2:text("Meetings")').locator('..').locator('div').filter({ hasText: /^\d+$/ });
    await expect(badgeLocator).toContainText('80');
    
    // Take screenshot
    await page.screenshot({ 
      path: 'screenshots/goodwill-project-47-80-meetings.png',
      fullPage: true 
    });
    
    console.log('✅ Goodwill project shows 80 meetings correctly');
  });

  test('Verify Seminole project (33) shows 1 meeting', async ({ page }) => {
    await page.goto('http://localhost:3001/projects/33');
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Verify project name
    await expect(page.locator('h1')).toContainText('Seminole Collective');
    
    // Wait for meetings section
    await page.waitForSelector('h2:text("Meetings")', { timeout: 10000 });
    
    // Verify meetings badge shows 1
    const badgeLocator = page.locator('h2:text("Meetings")').locator('..').locator('div').filter({ hasText: /^\d+$/ });
    await expect(badgeLocator).toContainText('1');
    
    // Take screenshot
    await page.screenshot({ 
      path: 'screenshots/seminole-project-33-1-meeting.png',
      fullPage: true 
    });
    
    console.log('✅ Seminole project shows 1 meeting correctly');
  });

  test('Verify table functionality and data display', async ({ page }) => {
    // Test with Tampa project which has meetings
    await page.goto('http://localhost:3001/projects/59');
    
    // Wait for page and table to load
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Verify table headers are present
    await expect(page.locator('th:text("Title")')).toBeVisible();
    await expect(page.locator('th:text("Date")')).toBeVisible();  
    await expect(page.locator('th:text("Summary")')).toBeVisible();
    await expect(page.locator('th:text("Actions")')).toBeVisible();
    
    // Count table rows (excluding header)
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBe(4);
    
    // Verify action buttons exist
    const actionButtons = page.locator('tbody tr button');
    const buttonCount = await actionButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // Take screenshot showing table functionality
    await page.screenshot({ 
      path: 'screenshots/meetings-table-functionality.png',
      fullPage: true 
    });
    
    console.log('✅ Table displays correct number of rows and has action buttons');
  });
});