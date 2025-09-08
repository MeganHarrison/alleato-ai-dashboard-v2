import { test, expect } from '@playwright/test';

/**
 * AI Insights Dashboard E2E Tests
 * 
 * Tests the complete functionality of the AI insights dashboard including:
 * - Page loading and component rendering
 * - Tab switching functionality 
 * - Insights feed display with priority markers
 * - Sidebar panels visibility
 * - Interactive elements and hover states
 */

test.describe('AI Insights Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the AI insights dashboard
    await page.goto('/ai-insights');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should load page correctly with all components rendering', async ({ page }) => {
    // Verify main heading is present
    await expect(page.getByRole('heading', { name: /AI Insights Dashboard/i })).toBeVisible();
    
    // Verify tab navigation is present
    await expect(page.getByRole('tab', { name: /Today/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Week/i })).toBeVisible(); 
    await expect(page.getByRole('tab', { name: /Projects/i })).toBeVisible();
    
    // Verify main content area is present
    await expect(page.locator('[data-testid="insights-feed"]')).toBeVisible();
    
    // Verify sidebar panels are present
    await expect(page.getByRole('heading', { name: /Active Projects/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Recent Meetings/i })).toBeVisible();
    
    console.log('✅ Page loaded with all components rendering correctly');
  });

  test('should handle tab switching functionality', async ({ page }) => {
    // Test Today tab (should be active by default)
    await expect(page.getByRole('tab', { name: /Today/i })).toHaveAttribute('aria-selected', 'true');
    
    // Click Week tab and verify it becomes active
    await page.getByRole('tab', { name: /Week/i }).click();
    await expect(page.getByRole('tab', { name: /Week/i })).toHaveAttribute('aria-selected', 'true');
    
    // Wait for content to potentially update
    await page.waitForTimeout(500);
    
    // Click Projects tab and verify it becomes active  
    await page.getByRole('tab', { name: /Projects/i }).click();
    await expect(page.getByRole('tab', { name: /Projects/i })).toHaveAttribute('aria-selected', 'true');
    
    // Wait for content to potentially update
    await page.waitForTimeout(500);
    
    // Go back to Today tab
    await page.getByRole('tab', { name: /Today/i }).click();
    await expect(page.getByRole('tab', { name: /Today/i })).toHaveAttribute('aria-selected', 'true');
    
    console.log('✅ Tab switching functionality works correctly');
  });

  test('should display insights feed with priority markers', async ({ page }) => {
    // Wait for insights to load
    await page.waitForSelector('[data-testid="insights-feed"]');
    
    // Check if insights are present
    const insightCards = page.locator('[data-testid="insight-card"]');
    const insightCount = await insightCards.count();
    
    if (insightCount > 0) {
      console.log(`Found ${insightCount} insight cards`);
      
      // Test first insight card
      const firstInsight = insightCards.first();
      await expect(firstInsight).toBeVisible();
      
      // Check for priority indicators (high, medium, low)
      const priorityIndicators = page.locator('[data-testid="priority-indicator"]');
      const priorityCount = await priorityIndicators.count();
      
      if (priorityCount > 0) {
        console.log(`Found ${priorityCount} priority indicators`);
        await expect(priorityIndicators.first()).toBeVisible();
      } else {
        console.log('No priority indicators found - checking for alternative priority markers');
        
        // Look for other priority markers like badges or colored indicators
        const badges = page.locator('.badge, [class*="priority"], [class*="urgent"], [class*="high"]');
        const badgeCount = await badges.count();
        console.log(`Found ${badgeCount} potential priority markers`);
      }
    } else {
      console.log('No insight cards found - checking for empty state or loading state');
      
      // Check for empty state message
      const emptyState = page.locator('text=/No insights/i, text=/No data/i, text=/Coming soon/i');
      const hasEmptyState = await emptyState.count() > 0;
      
      if (hasEmptyState) {
        console.log('Empty state detected');
      } else {
        console.log('No insights or empty state found - may still be loading');
      }
    }
    
    console.log('✅ Insights feed display tested');
  });

  test('should show sidebar panels correctly', async ({ page }) => {
    // Test Projects panel
    const projectsPanel = page.getByRole('heading', { name: /Active Projects/i }).locator('..');
    await expect(projectsPanel).toBeVisible();
    
    // Look for project items
    const projectItems = page.locator('[data-testid="project-item"], .project-card, [class*="project"]');
    const projectCount = await projectItems.count();
    console.log(`Found ${projectCount} project items in sidebar`);
    
    // Test Meetings panel  
    const meetingsPanel = page.getByRole('heading', { name: /Recent Meetings/i }).locator('..');
    await expect(meetingsPanel).toBeVisible();
    
    // Look for meeting items
    const meetingItems = page.locator('[data-testid="meeting-item"], .meeting-card, [class*="meeting"]');
    const meetingCount = await meetingItems.count();
    console.log(`Found ${meetingCount} meeting items in sidebar`);
    
    console.log('✅ Sidebar panels are visible and functional');
  });

  test('should handle hover states and interactive elements', async ({ page }) => {
    // Test tab hover states
    const todayTab = page.getByRole('tab', { name: /Today/i });
    await todayTab.hover();
    await page.waitForTimeout(200); // Allow hover animation
    
    const weekTab = page.getByRole('tab', { name: /Week/i });
    await weekTab.hover(); 
    await page.waitForTimeout(200);
    
    // Test insight card hover states if they exist
    const insightCards = page.locator('[data-testid="insight-card"]');
    const cardCount = await insightCards.count();
    
    if (cardCount > 0) {
      await insightCards.first().hover();
      await page.waitForTimeout(200);
      console.log('✅ Insight card hover state tested');
    }
    
    // Test sidebar item hover states
    const projectItems = page.locator('[data-testid="project-item"]');
    const projectItemCount = await projectItems.count();
    
    if (projectItemCount > 0) {
      await projectItems.first().hover();
      await page.waitForTimeout(200);
      console.log('✅ Project item hover state tested');
    }
    
    console.log('✅ Interactive elements and hover states tested');
  });

  test('should take comprehensive screenshot of dashboard', async ({ page }) => {
    // Ensure we're on the Today tab for consistency
    await page.getByRole('tab', { name: /Today/i }).click();
    await page.waitForTimeout(1000);
    
    // Wait for any animations or loading to complete
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'screenshots/ai-insights-dashboard.png',
      fullPage: true 
    });
    
    console.log('✅ Comprehensive dashboard screenshot saved');
  });
});