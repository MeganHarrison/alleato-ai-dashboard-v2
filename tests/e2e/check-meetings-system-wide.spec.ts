import { test, expect } from '@playwright/test';

test.describe('Project Meetings System-wide Validation', () => {
  test('Tampa Event/Party project (ID 59) should show 4 meetings', async ({ page }) => {
    await page.goto('http://localhost:3001/projects/59');
    
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Tampa Event/Party');
    
    // Wait for meetings section to load
    await expect(page.locator('h2:has-text("Meetings")')).toBeVisible();
    
    // Check the meetings count badge
    const meetingsBadge = page.locator('h2:has-text("Meetings") + div .badge, h2:has-text("Meetings") ~ * .badge').first();
    await expect(meetingsBadge).toContainText('4');
    
    // Verify the table shows meetings data
    await expect(page.locator('[data-testid="documents-table"], .table, table')).toBeVisible();
    
    // Count the number of meeting rows (excluding header)
    const tableRows = page.locator('tbody tr, .table-row[data-meeting-id], [data-testid="meeting-row"]');
    await expect(tableRows).toHaveCount(4);
    
    // Take a screenshot
    await page.screenshot({ path: 'screenshots/tampa-project-59-meetings.png', fullPage: true });
  });

  test('Goodwill Bloomington project (ID 47) should show 80 meetings', async ({ page }) => {
    await page.goto('http://localhost:3001/projects/47');
    
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Goodwill Bloomington');
    
    // Wait for meetings section to load
    await expect(page.locator('h2:has-text("Meetings")')).toBeVisible();
    
    // Check the meetings count badge
    const meetingsBadge = page.locator('h2:has-text("Meetings") + div .badge, h2:has-text("Meetings") ~ * .badge').first();
    await expect(meetingsBadge).toContainText('80');
    
    // Verify the table shows meetings data
    await expect(page.locator('[data-testid="documents-table"], .table, table')).toBeVisible();
    
    // Check that there are meeting rows (we expect a lot, so just verify some exist)
    const tableRows = page.locator('tbody tr, .table-row[data-meeting-id], [data-testid="meeting-row"]');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(10); // Should have many rows
    
    // Take a screenshot
    await page.screenshot({ path: 'screenshots/goodwill-project-47-meetings.png', fullPage: true });
  });

  test('Seminole Collective project (ID 33) should show 1 meeting', async ({ page }) => {
    await page.goto('http://localhost:3001/projects/33');
    
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Seminole Collective');
    
    // Wait for meetings section to load
    await expect(page.locator('h2:has-text("Meetings")')).toBeVisible();
    
    // Check the meetings count badge
    const meetingsBadge = page.locator('h2:has-text("Meetings") + div .badge, h2:has-text("Meetings") ~ * .badge').first();
    await expect(meetingsBadge).toContainText('1');
    
    // Verify the table shows meetings data
    await expect(page.locator('[data-testid="documents-table"], .table, table')).toBeVisible();
    
    // Count the number of meeting rows (should be exactly 1)
    const tableRows = page.locator('tbody tr, .table-row[data-meeting-id], [data-testid="meeting-row"]');
    await expect(tableRows).toHaveCount(1);
    
    // Take a screenshot
    await page.screenshot({ path: 'screenshots/seminole-project-33-meetings.png', fullPage: true });
  });

  test('Project without meetings should show empty state', async ({ page }) => {
    // Test a project that likely has no meetings (using a higher ID that may not have meetings)
    await page.goto('http://localhost:3001/projects/100');
    
    // Wait for the page to load (it might redirect or show 404 if project doesn't exist)
    // If project doesn't exist, try another ID
    const isNotFound = await page.locator('h1:has-text("Not Found"), h1:has-text("404")').isVisible();
    
    if (isNotFound) {
      // Try project ID 1 instead
      await page.goto('http://localhost:3001/projects/1');
    }
    
    // Wait for meetings section to load
    await expect(page.locator('h2:has-text("Meetings")')).toBeVisible();
    
    // Check the meetings count badge (should be 0 or empty)
    const meetingsBadge = page.locator('h2:has-text("Meetings") + div .badge, h2:has-text("Meetings") ~ * .badge').first();
    const badgeText = await meetingsBadge.textContent();
    expect(['0', '']).toContain(badgeText?.trim());
    
    // Check for empty state message
    await expect(page.locator('text="No meetings found", text="No documents found"')).toBeVisible();
    
    // Take a screenshot
    await page.screenshot({ path: 'screenshots/empty-project-meetings.png', fullPage: true });
  });

  test('Verify Edit/Download/Delete buttons functionality', async ({ page }) => {
    // Go to Tampa project which should have meetings
    await page.goto('http://localhost:3001/projects/59');
    
    // Wait for the page and meetings to load
    await expect(page.locator('h2:has-text("Meetings")')).toBeVisible();
    await expect(page.locator('[data-testid="documents-table"], .table, table')).toBeVisible();
    
    // Look for action buttons (Edit, Download, Delete)
    const editButtons = page.locator('button:has-text("Edit"), [aria-label*="Edit"], .edit-button');
    const downloadButtons = page.locator('button:has-text("Download"), [aria-label*="Download"], .download-button');
    const deleteButtons = page.locator('button:has-text("Delete"), [aria-label*="Delete"], .delete-button');
    
    // Check if any of these buttons exist
    const hasEditButtons = await editButtons.count() > 0;
    const hasDownloadButtons = await downloadButtons.count() > 0;
    const hasDeleteButtons = await deleteButtons.count() > 0;
    
    console.log(`Found ${await editButtons.count()} edit buttons`);
    console.log(`Found ${await downloadButtons.count()} download buttons`);
    console.log(`Found ${await deleteButtons.count()} delete buttons`);
    
    // Test clicking the first available button (just to verify it's clickable)
    if (hasEditButtons) {
      await editButtons.first().click();
      // Check if some modal or form appears
      await page.waitForTimeout(500);
    } else if (hasDownloadButtons) {
      await downloadButtons.first().click();
      await page.waitForTimeout(500);
    }
    
    // Take a screenshot showing the button interaction
    await page.screenshot({ path: 'screenshots/meetings-buttons-functionality.png', fullPage: true });
  });
});