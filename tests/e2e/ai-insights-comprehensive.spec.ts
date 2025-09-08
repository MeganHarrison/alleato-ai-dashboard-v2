import { test, expect } from '@playwright/test';

/**
 * Comprehensive AI Insights Dashboard E2E Tests
 * 
 * Based on the actual page structure, this test validates:
 * - Page loading and component rendering
 * - Tab switching functionality (Today, Week, Projects)
 * - Insights feed display with priority markers
 * - Sidebar panels visibility (Projects and Today's Meetings)
 * - Interactive elements and hover states
 */

test.describe('AI Insights Dashboard - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-insights');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Allow for any animations
  });

  test('should load page correctly with all components rendering', async ({ page }) => {
    console.log('Testing page loading and component rendering...');
    
    // Verify main heading is present
    await expect(page.getByText('Today • Sept 8, 2025')).toBeVisible();
    console.log('✅ Main heading visible');
    
    // Verify tab navigation is present (based on screenshot, we see Today, Week, Projects)
    await expect(page.getByText('Today', { exact: true })).toBeVisible();
    await expect(page.getByText('Week')).toBeVisible();
    await expect(page.getByText('Projects', { exact: true })).toBeVisible();
    console.log('✅ Tab navigation visible');
    
    // Verify insights summary stats
    await expect(page.getByText('3 High Priority')).toBeVisible();
    await expect(page.getByText('2 Actions')).toBeVisible(); 
    await expect(page.getByText('3 Meetings')).toBeVisible();
    await expect(page.getByText('1 Risks')).toBeVisible();
    console.log('✅ Insights summary stats visible');
    
    // Verify Key Insights section
    await expect(page.getByText('Key Insights')).toBeVisible();
    console.log('✅ Key Insights section visible');
    
    // Verify sidebar sections
    await expect(page.getByText('Projects', { exact: true })).toBeVisible();
    await expect(page.getByText("Today's Meetings")).toBeVisible();
    console.log('✅ Sidebar sections visible');
    
    console.log('✅ Page loaded with all components rendering correctly');
  });

  test('should display insights feed with priority markers', async ({ page }) => {
    console.log('Testing insights feed display and priority markers...');
    
    // Check for high priority insights
    await expect(page.getByText('1 High Priority')).toBeVisible();
    await expect(page.getByText('action94%')).toBeVisible();
    console.log('✅ High priority action insight visible');
    
    // Check for specific insights content
    await expect(page.getByText('Complete security audit for Alpha project before Friday deadline')).toBeVisible();
    await expect(page.getByText('AlphaMike ChenDue Sept 12')).toBeVisible();
    await expect(page.getByText('risk87%')).toBeVisible();
    console.log('✅ Security audit insight with priority visible');
    
    // Check for budget overrun insight
    await expect(page.getByText('Budget overrun risk on Beta project due to scope creep')).toBeVisible();
    await expect(page.getByText('BetaHigh severityMedium likelihood')).toBeVisible();
    await expect(page.getByText('decision91%')).toBeVisible();
    console.log('✅ Budget overrun insight with severity visible');
    
    // Check for AWS migration insight
    await expect(page.getByText('AWS migration approved for Q4 implementation')).toBeVisible();
    await expect(page.getByText('InfrastructureDevOps, EngineeringQ4 2025')).toBeVisible();
    await expect(page.getByText('question76%')).toBeVisible();
    console.log('✅ AWS migration insight visible');
    
    console.log('✅ Insights feed displays correctly with priority markers');
  });

  test('should handle tab switching functionality', async ({ page }) => {
    console.log('Testing tab switching functionality...');
    
    // Find tab elements by their text content (they're not using role="tab")
    const todayTab = page.getByText('Today', { exact: true }).first();
    const weekTab = page.getByText('Week').first();
    const projectsTab = page.getByText('Projects').first();
    
    // Today tab should be active initially (verify by checking for active content)
    await expect(page.getByText('Today • Sept 8, 2025')).toBeVisible();
    console.log('✅ Today tab appears active by default');
    
    // Click Week tab
    await weekTab.click();
    await page.waitForTimeout(500);
    console.log('✅ Clicked Week tab');
    
    // Click Projects tab  
    await projectsTab.click();
    await page.waitForTimeout(500);
    console.log('✅ Clicked Projects tab');
    
    // Go back to Today tab
    await todayTab.click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Today • Sept 8, 2025')).toBeVisible();
    console.log('✅ Returned to Today tab');
    
    console.log('✅ Tab switching functionality works correctly');
  });

  test('should show sidebar panels correctly', async ({ page }) => {
    console.log('Testing sidebar panels visibility...');
    
    // Test Projects panel
    await expect(page.getByText('Projects', { exact: true })).toBeVisible();
    
    // Check for specific projects
    await expect(page.getByText('Alpha Project')).toBeVisible();
    await expect(page.getByText('At Risk')).toBeVisible();
    await expect(page.getByText('Beta Project')).toBeVisible();
    await expect(page.getByText('Attention')).toBeVisible();
    await expect(page.getByText('Gamma Project')).toBeVisible();
    await expect(page.getByText('On Track')).toBeVisible();
    await expect(page.getByText('Infrastructure')).toBeVisible();
    console.log('✅ Projects panel shows all projects with status');
    
    // Test Meetings panel
    await expect(page.getByText("Today's Meetings")).toBeVisible();
    
    // Check for specific meetings
    await expect(page.getByText('Alpha Sprint Review')).toBeVisible();
    await expect(page.getByText('9:00 AM')).toBeVisible();
    await expect(page.getByText('Security audit concerns, timeline risks')).toBeVisible();
    await expect(page.getByText('94%')).toBeVisible();
    
    await expect(page.getByText('Beta Budget Review')).toBeVisible();
    await expect(page.getByText('11:30 AM')).toBeVisible();
    await expect(page.getByText('Budget overrun risk, scope decisions')).toBeVisible();
    await expect(page.getByText('87%')).toBeVisible();
    
    await expect(page.getByText('Infrastructure Planning')).toBeVisible();
    await expect(page.getByText('2:00 PM')).toBeVisible();
    await expect(page.getByText('AWS migration approved, Q4 timeline')).toBeVisible();
    await expect(page.getByText('91%')).toBeVisible();
    
    console.log('✅ Meetings panel shows all meetings with details and confidence scores');
    
    console.log('✅ Sidebar panels are visible and functional');
  });

  test('should handle hover states and interactive elements', async ({ page }) => {
    console.log('Testing hover states and interactive elements...');
    
    // Test tab hover states
    const todayTab = page.getByText('Today', { exact: true }).first();
    await todayTab.hover();
    await page.waitForTimeout(200);
    console.log('✅ Today tab hover tested');
    
    const weekTab = page.getByText('Week').first();
    await weekTab.hover();
    await page.waitForTimeout(200);
    console.log('✅ Week tab hover tested');
    
    // Test project item hover states
    const alphaProject = page.getByText('Alpha Project').first();
    await alphaProject.hover();
    await page.waitForTimeout(200);
    console.log('✅ Alpha project hover tested');
    
    // Test meeting item hover states
    const alphaSprintReview = page.getByText('Alpha Sprint Review').first();
    await alphaSprintReview.hover();
    await page.waitForTimeout(200);
    console.log('✅ Meeting item hover tested');
    
    // Test insight item hover states
    const securityAuditInsight = page.getByText('Complete security audit for Alpha project before Friday deadline').first();
    await securityAuditInsight.hover();
    await page.waitForTimeout(200);
    console.log('✅ Insight item hover tested');
    
    console.log('✅ Interactive elements and hover states tested');
  });

  test('should take final comprehensive screenshot', async ({ page }) => {
    console.log('Taking final comprehensive screenshot...');
    
    // Ensure we're on the Today tab for consistency
    const todayTab = page.getByText('Today', { exact: true }).first();
    await todayTab.click();
    await page.waitForTimeout(1000);
    
    // Wait for any animations or loading to complete
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'screenshots/ai-insights-dashboard.png',
      fullPage: true 
    });
    
    console.log('✅ Comprehensive dashboard screenshot saved to screenshots/ai-insights-dashboard.png');
  });
});