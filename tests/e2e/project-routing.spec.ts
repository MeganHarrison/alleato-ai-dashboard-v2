import { test, expect } from '@playwright/test';

test.describe('Project Dashboard and Detail Page Routing', () => {
  test('should navigate from projects dashboard to project detail page', async ({ page }) => {
    // Navigate to projects dashboard
    await page.goto('http://localhost:3001/projects-dashboard');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the projects dashboard
    const dashboardTitle = await page.locator('h1:has-text("Projects Dashboard")').isVisible();
    console.log('Dashboard title visible:', dashboardTitle);
    
    // Wait for project cards/table to load
    await page.waitForTimeout(2000);
    
    // Try to find a project link in card view
    const projectLinks = await page.locator('a[href^="/projects/"]').count();
    console.log('Number of project links found:', projectLinks);
    
    if (projectLinks > 0) {
      // Get the first project link
      const firstProjectLink = page.locator('a[href^="/projects/"]').first();
      const projectHref = await firstProjectLink.getAttribute('href');
      console.log('First project link href:', projectHref);
      
      // Click on the first project
      await firstProjectLink.click();
      
      // Wait for navigation
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Check the current URL
      const currentUrl = page.url();
      console.log('Current URL after click:', currentUrl);
      
      // Check if we're on a project detail page
      const isProjectDetailPage = currentUrl.includes('/projects/');
      console.log('Is on project detail page:', isProjectDetailPage);
      
      // Check for project detail page elements
      const hasPageHeader = await page.locator('[class*="PageHeader"], h1').isVisible();
      const hasProjectCards = await page.locator('.card, [class*="Card"]').count() > 0;
      
      console.log('Has page header:', hasPageHeader);
      console.log('Has project cards:', hasProjectCards);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'project-detail-page.png', fullPage: true });
      
      expect(isProjectDetailPage).toBeTruthy();
    } else {
      console.log('No projects found in the dashboard');
      // Take a screenshot for debugging
      await page.screenshot({ path: 'projects-dashboard-empty.png', fullPage: true });
    }
  });
  
  test('should directly access a project detail page', async ({ page }) => {
    // First get a project ID from the dashboard
    await page.goto('http://localhost:3001/projects-dashboard');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = await page.locator('a[href^="/projects/"]').all();
    
    if (projectLinks.length > 0) {
      const firstLink = projectLinks[0];
      const href = await firstLink.getAttribute('href');
      const projectId = href?.split('/').pop();
      
      if (projectId) {
        console.log('Testing direct access to project:', projectId);
        
        // Try to directly navigate to the project detail page
        const projectUrl = `http://localhost:3001/projects/${projectId}`;
        console.log('Navigating to:', projectUrl);
        
        await page.goto(projectUrl);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Check where we ended up
        const finalUrl = page.url();
        console.log('Final URL:', finalUrl);
        
        // Check if we were redirected
        const wasRedirected = !finalUrl.includes(`/projects/${projectId}`);
        console.log('Was redirected:', wasRedirected);
        
        if (wasRedirected) {
          console.log('Redirected to:', finalUrl);
        }
        
        // Take a screenshot
        await page.screenshot({ path: 'direct-project-access.png', fullPage: true });
        
        expect(finalUrl).toContain(`/projects/${projectId}`);
      }
    }
  });
});