import { test, expect } from '@playwright/test';

test.describe('Full Project Routing Test', () => {
  test('create test data and verify project routing', async ({ page }) => {
    console.log('=== STEP 1: Creating Test Projects ===');
    
    // Navigate to test data creation page
    await page.goto('http://localhost:3001/create-test-data');
    await page.waitForLoadState('networkidle');
    
    // Click create test projects button
    await page.click('button:has-text("Create Test Projects")');
    
    // Wait for success message
    await page.waitForSelector('text=/Successfully created/i', { timeout: 10000 });
    const resultText = await page.locator('div[class*="green"]').textContent();
    console.log('Creation result:', resultText);
    
    console.log('=== STEP 2: Testing Projects Dashboard ===');
    
    // Navigate to projects dashboard
    await page.goto('http://localhost:3001/projects-dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check the default filter
    const filterValue = await page.locator('select').first().inputValue();
    console.log('Default filter value:', filterValue);
    
    // Count projects with Current filter
    let projectLinks = await page.locator('a[href^="/projects/"]').count();
    console.log(`Projects visible with "${filterValue}" filter:`, projectLinks);
    
    // If no projects visible with Current filter, switch to All
    if (projectLinks === 0 && filterValue === 'Current') {
      console.log('No Current projects, switching to All Status...');
      await page.selectOption('select', 'all');
      await page.waitForTimeout(1000);
      projectLinks = await page.locator('a[href^="/projects/"]').count();
      console.log('Projects visible with "all" filter:', projectLinks);
    }
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'test-dashboard-with-projects.png', fullPage: true });
    
    expect(projectLinks).toBeGreaterThan(0);
    
    console.log('=== STEP 3: Testing Navigation to Project Detail ===');
    
    // Get the first project link details
    const firstProjectLink = page.locator('a[href^="/projects/"]').first();
    const projectHref = await firstProjectLink.getAttribute('href');
    const projectName = await firstProjectLink.textContent();
    console.log('First project:', { href: projectHref, name: projectName });
    
    // Click on the first project
    console.log('Clicking on project link...');
    await firstProjectLink.click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after click:', currentUrl);
    
    // Check if we're on the project detail page
    const isProjectDetailPage = currentUrl.includes('/projects/') && !currentUrl.includes('projects-dashboard');
    console.log('Is on project detail page:', isProjectDetailPage);
    
    // Check page content
    const h1Text = await page.locator('h1').first().textContent();
    console.log('Page H1 text:', h1Text);
    
    // Check for key project detail elements
    const hasCards = await page.locator('[class*="Card"], .card').count() > 0;
    const hasTabs = await page.locator('[role="tablist"], [class*="Tabs"]').count() > 0;
    console.log('Has cards:', hasCards);
    console.log('Has tabs:', hasTabs);
    
    // Take screenshot of project detail page
    await page.screenshot({ path: 'test-project-detail.png', fullPage: true });
    
    expect(isProjectDetailPage).toBeTruthy();
    expect(currentUrl).toContain('/projects/');
    
    console.log('=== STEP 4: Testing Direct Access to Project ===');
    
    // Extract project ID from URL
    const projectId = currentUrl.split('/projects/')[1]?.split('?')[0];
    console.log('Project ID:', projectId);
    
    if (projectId) {
      // Try direct access
      const directUrl = `http://localhost:3001/projects/${projectId}`;
      console.log('Testing direct access to:', directUrl);
      
      await page.goto(directUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const finalUrl = page.url();
      console.log('Final URL after direct access:', finalUrl);
      
      const stillOnProjectPage = finalUrl.includes(`/projects/${projectId}`);
      console.log('Still on project page:', stillOnProjectPage);
      
      // Take screenshot
      await page.screenshot({ path: 'test-direct-access.png', fullPage: true });
      
      expect(stillOnProjectPage).toBeTruthy();
    }
    
    console.log('=== TEST COMPLETE ===');
  });
});