import { test, expect } from '@playwright/test';

test.describe('Simple Project Routing Test', () => {
  test('verify projects dashboard loads and handles empty state', async ({ page }) => {
    console.log('=== Testing Projects Dashboard ===');
    
    // Navigate to projects dashboard
    await page.goto('http://localhost:3001/projects-dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check if dashboard loads
    const dashboardTitle = await page.locator('h1:has-text("Projects Dashboard")');
    await expect(dashboardTitle).toBeVisible();
    console.log('✓ Projects Dashboard loaded');
    
    // Check for any projects or empty state
    const projectLinks = await page.locator('a[href^="/projects/"]').count();
    const noProjectsMessage = await page.locator('text=/no projects found/i').count();
    
    console.log(`Projects found: ${projectLinks}`);
    console.log(`Empty state visible: ${noProjectsMessage > 0}`);
    
    // Take screenshot
    await page.screenshot({ path: 'simple-dashboard-test.png', fullPage: true });
    
    // If there are projects, test clicking one
    if (projectLinks > 0) {
      console.log('=== Testing Project Detail Navigation ===');
      
      const firstProject = page.locator('a[href^="/projects/"]').first();
      const projectHref = await firstProject.getAttribute('href');
      console.log(`Clicking project with href: ${projectHref}`);
      
      await firstProject.click();
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      // Verify we're on a project detail page
      expect(currentUrl).toContain('/projects/');
      expect(currentUrl).not.toContain('projects-dashboard');
      
      await page.screenshot({ path: 'simple-project-detail.png', fullPage: true });
      console.log('✓ Project detail page navigation works');
    } else {
      console.log('No projects to test navigation with');
    }
  });
  
  test('verify direct project URL access', async ({ page }) => {
    console.log('=== Testing Direct Project Access ===');
    
    // Try accessing a project directly (using a fake ID)
    const testProjectId = '123';
    const projectUrl = `http://localhost:3001/projects/${testProjectId}`;
    
    console.log(`Attempting direct access to: ${projectUrl}`);
    await page.goto(projectUrl);
    await page.waitForLoadState('networkidle');
    
    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}`);
    
    // Check if we stayed on the project page or got redirected
    if (finalUrl.includes('/auth/login')) {
      console.log('✗ Got redirected to login - auth middleware issue');
    } else if (finalUrl.includes(`/projects/${testProjectId}`)) {
      console.log('✓ Direct project access works (stayed on project page)');
      
      // Check for 404 or not found message
      const notFoundMessage = await page.locator('text=/not found|404/i').count();
      if (notFoundMessage > 0) {
        console.log('Project not found (expected for fake ID)');
      }
    } else {
      console.log(`✗ Unexpected redirect to: ${finalUrl}`);
    }
    
    await page.screenshot({ path: 'simple-direct-access.png', fullPage: true });
  });
});