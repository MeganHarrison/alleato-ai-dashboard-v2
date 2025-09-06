import { test, expect } from '@playwright/test';

test.describe('Project Routing Debug', () => {
  test('debug project dashboard and routing', async ({ page }) => {
    // Navigate to projects dashboard
    await page.goto('http://localhost:3001/projects-dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('=== DEBUGGING PROJECT DASHBOARD ===');
    
    // Check what filter is selected
    const filterValue = await page.locator('select').first().inputValue();
    console.log('Current filter value:', filterValue);
    
    // Check if there's a "No projects found" message
    const noProjectsMessage = await page.locator('text=/no projects found/i').count();
    console.log('No projects found message visible:', noProjectsMessage > 0);
    
    // Try changing filter to "All Status"
    console.log('Changing filter to "All Status"...');
    await page.selectOption('select', 'all');
    await page.waitForTimeout(2000);
    
    // Check for projects again
    const projectsAfterAll = await page.locator('a[href^="/projects/"]').count();
    console.log('Projects after changing to "All Status":', projectsAfterAll);
    
    // Check for any cards or table rows
    const cards = await page.locator('[class*="Card"], .card').count();
    const tableRows = await page.locator('tbody tr').count();
    console.log('Cards found:', cards);
    console.log('Table rows found:', tableRows);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-dashboard-all.png', fullPage: true });
    
    // Try to get any project data from the page
    const projectNames = await page.locator('a[href^="/projects/"]').allTextContents();
    console.log('Project names found:', projectNames);
    
    if (projectsAfterAll > 0) {
      // Get the first project link
      const firstProjectLink = page.locator('a[href^="/projects/"]').first();
      const projectHref = await firstProjectLink.getAttribute('href');
      const projectText = await firstProjectLink.textContent();
      console.log('First project:', { href: projectHref, text: projectText });
      
      // Try clicking it
      console.log('Clicking on first project...');
      await firstProjectLink.click();
      
      // Wait and check where we end up
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      console.log('URL after click:', currentUrl);
      
      // Check page content
      const pageTitle = await page.title();
      const h1Text = await page.locator('h1').first().textContent();
      console.log('Page title:', pageTitle);
      console.log('H1 text:', h1Text);
      
      // Check for error messages
      const errorMessages = await page.locator('text=/error|not found|404/i').count();
      console.log('Error messages found:', errorMessages);
      
      // Take screenshot of where we ended up
      await page.screenshot({ path: 'debug-after-click.png', fullPage: true });
      
      // Check if we're still on the dashboard or actually on a project page
      const onDashboard = currentUrl.includes('projects-dashboard');
      const onProjectDetail = currentUrl.includes('/projects/') && !currentUrl.includes('projects-dashboard');
      console.log('Still on dashboard:', onDashboard);
      console.log('On project detail:', onProjectDetail);
    } else {
      console.log('No projects found even with "All Status" filter');
      
      // Let's check if the API is returning data
      const response = await page.evaluate(async () => {
        try {
          const res = await fetch('/api/projects');
          if (res.ok) {
            const data = await res.json();
            return { ok: true, count: data.length };
          }
          return { ok: false, status: res.status };
        } catch (e) {
          return { ok: false, error: e.message };
        }
      });
      console.log('API check:', response);
    }
  });
});