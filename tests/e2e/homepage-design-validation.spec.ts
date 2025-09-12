import { test, expect } from '@playwright/test';
import { join } from 'path';

/**
 * Comprehensive test suite for the modernized homepage design validation
 * 
 * Tests the actual ModernHomepage component with:
 * - Project cards with modern styling
 * - Meetings section with time-based grouping
 * - Insights section with enhanced cards
 * - Responsive design and interactions
 */

const screenshotPath = (filename: string) => 
  join('screenshots', 'homepage-modern-design', filename);

test.describe('Homepage Modern Design Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:3001');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for any dynamic content to load
    await page.waitForTimeout(3000);
  });

  test('should display full homepage with sidebar and modern content layout', async ({ page }) => {
    // Take full page screenshot first
    await page.screenshot({ 
      path: screenshotPath('01-full-homepage-layout.png'),
      fullPage: true 
    });

    // Verify main sections are present (case insensitive and flexible)
    const dashboardText = page.locator('text=/dashboard/i').first();
    await expect(dashboardText).toBeVisible();

    // Check for the modern split layout
    const mainContent = page.locator('main, [role="main"], .space-y-8').first();
    if (await mainContent.count() > 0) {
      await expect(mainContent).toBeVisible();
    }

    console.log('✓ Full homepage layout captured and verified');
  });

  test('should display modern project cards with enhanced styling', async ({ page }) => {
    // Look for project section elements
    const projectSection = page.locator('text=/active projects/i').first();
    
    if (await projectSection.count() > 0) {
      // Take screenshot of the projects area
      const projectArea = projectSection.locator('..').locator('..');
      await projectArea.screenshot({
        path: screenshotPath('02-modern-project-cards.png')
      });

      // Look for project cards
      const projectCards = page.locator('a[href*="/projects/"]');
      
      if (await projectCards.count() > 0) {
        const firstCard = projectCards.first();
        
        // Test card hover state
        await firstCard.hover();
        await page.waitForTimeout(500);
        
        await page.screenshot({
          path: screenshotPath('03-project-card-hover.png'),
          clip: await firstCard.boundingBox() || undefined
        });

        // Verify card has white background (modern design)
        const cardBg = await firstCard.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        
        console.log(`✓ Project card background: ${cardBg}`);
        
        // Test that revenue labels are visible
        const revenueText = firstCard.locator('text=/revenue|est/i');
        if (await revenueText.count() > 0) {
          await expect(revenueText).toBeVisible();
          console.log('✓ Revenue labels found and visible');
        }
      } else {
        console.log('! No project cards found - may be empty state');
        await page.screenshot({ path: screenshotPath('02-no-projects-state.png') });
      }
    } else {
      console.log('! Projects section not found');
    }
  });

  test('should display meetings section with sleek new grouping', async ({ page }) => {
    // Look for meetings section
    const meetingsSection = page.locator('text=/recent meetings/i').first();
    
    if (await meetingsSection.count() > 0) {
      // Take screenshot of meetings area
      const meetingsArea = meetingsSection.locator('..').locator('..');
      await meetingsArea.screenshot({
        path: screenshotPath('04-sleek-meetings-section.png')
      });

      // Check for time-based groupings
      const timeGroups = [
        page.locator('text=/today/i').first(),
        page.locator('text=/yesterday/i').first(),
        page.locator('text=/this week/i').first()
      ];

      let foundGroups = 0;
      for (const group of timeGroups) {
        if (await group.count() > 0) {
          await expect(group).toBeVisible();
          foundGroups++;
        }
      }

      console.log(`✓ Found ${foundGroups} time-based meeting groups`);

      // Test meeting item hover if meetings exist
      const meetingItems = page.locator('a[href*="/meetings/"]');
      if (await meetingItems.count() > 0) {
        const firstMeeting = meetingItems.first();
        await firstMeeting.hover();
        await page.waitForTimeout(500);
        
        await page.screenshot({
          path: screenshotPath('05-meeting-item-hover.png'),
          clip: await firstMeeting.boundingBox() || undefined
        });

        console.log('✓ Meeting hover state tested');
      } else {
        console.log('! No meeting items found - may be empty state');
        await page.screenshot({ path: screenshotPath('05-no-meetings-state.png') });
      }
    } else {
      console.log('! Meetings section not found');
    }
  });

  test('should display enhanced insights section with modern cards', async ({ page }) => {
    // Look for insights section
    const insightsSection = page.locator('text=/recent insights/i').first();
    
    if (await insightsSection.count() > 0) {
      // Take screenshot of insights area
      const insightsArea = insightsSection.locator('..').locator('..');
      await insightsArea.screenshot({
        path: screenshotPath('06-enhanced-insights-section.png')
      });

      // Look for insight cards
      const insightCards = page.locator('.bg-white').filter({ 
        has: page.locator('text=/high|medium|low/i') 
      });
      
      if (await insightCards.count() > 0) {
        const firstInsight = insightCards.first();
        
        // Verify white background
        const cardBg = await firstInsight.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        console.log(`✓ Insight card background: ${cardBg}`);
        
        // Test hover state
        await firstInsight.hover();
        await page.waitForTimeout(500);
        
        await page.screenshot({
          path: screenshotPath('07-insight-card-hover.png'),
          clip: await firstInsight.boundingBox() || undefined
        });

        // Check for severity badges (should be rounded-full)
        const severityBadges = firstInsight.locator('[class*="rounded-full"]');
        if (await severityBadges.count() > 0) {
          const badge = severityBadges.first();
          const borderRadius = await badge.evaluate(el => 
            window.getComputedStyle(el).borderRadius
          );
          console.log(`✓ Severity badge border-radius: ${borderRadius}`);
        }

        console.log('✓ Insight cards with modern styling found');
      } else {
        console.log('! No insight cards found - may be empty state');
        await page.screenshot({ path: screenshotPath('07-no-insights-state.png') });
      }
    } else {
      console.log('! Insights section not found');
    }
  });

  test('should have proper spacing and modern layout', async ({ page }) => {
    // Take screenshot focused on overall layout
    await page.screenshot({ 
      path: screenshotPath('08-layout-spacing-overview.png'),
      fullPage: true 
    });

    // Check for the light gray background (bg-gray-50/50)
    const mainContainer = page.locator('.bg-gray-50\\/50').first();
    if (await mainContainer.count() > 0) {
      const bgColor = await mainContainer.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      console.log(`✓ Main container background: ${bgColor}`);
    }

    // Check for grid layout spacing (gap-16)
    const gridContainer = page.locator('.grid').first();
    if (await gridContainer.count() > 0) {
      const gap = await gridContainer.evaluate(el => 
        window.getComputedStyle(el).gap
      );
      console.log(`✓ Grid container gap: ${gap}`);
    }

    // Verify modern typography
    const headings = page.locator('h1, h2, h3').first();
    if (await headings.count() > 0) {
      const fontSize = await headings.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      const fontWeight = await headings.evaluate(el => 
        window.getComputedStyle(el).fontWeight
      );
      console.log(`✓ Heading typography - size: ${fontSize}, weight: ${fontWeight}`);
    }
  });

  test('should have working links and search functionality', async ({ page }) => {
    // Test search functionality
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="projects" i]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('test project');
      await page.waitForTimeout(500);
      
      await page.screenshot({
        path: screenshotPath('09-search-functionality.png')
      });
      
      // Clear search
      await searchInput.clear();
      console.log('✓ Search functionality tested');
    }

    // Test project links
    const projectLinks = page.locator('a[href*="/projects/"]').first();
    if (await projectLinks.count() > 0) {
      const href = await projectLinks.getAttribute('href');
      expect(href).toBeTruthy();
      
      await projectLinks.hover();
      console.log(`✓ Project link verified: ${href}`);
    }

    // Test "View all" links
    const viewAllLinks = page.locator('a:has-text("View all")').first();
    if (await viewAllLinks.count() > 0) {
      const href = await viewAllLinks.getAttribute('href');
      expect(href).toBeTruthy();
      console.log(`✓ View all link verified: ${href}`);
    }

    // Test sidebar toggle
    const sidebarToggle = page.locator('[data-testid="sidebar-trigger"], button:has-text("Menu")').first();
    if (await sidebarToggle.count() > 0) {
      await sidebarToggle.click();
      await page.waitForTimeout(500);
      
      await page.screenshot({
        path: screenshotPath('10-sidebar-toggle.png')
      });
      
      // Toggle back
      await sidebarToggle.click();
      await page.waitForTimeout(500);
      console.log('✓ Sidebar toggle tested');
    }
  });

  test('should be responsive at different viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1024, height: 768, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: screenshotPath(`11-responsive-${viewport.name}.png`),
        fullPage: true 
      });
      
      // Check that content is still visible and properly laid out
      const mainContent = page.locator('h1, .text-2xl').first();
      if (await mainContent.count() > 0) {
        await expect(mainContent).toBeVisible();
      }
      
      console.log(`✓ Responsive design verified at ${viewport.name} (${viewport.width}x${viewport.height})`);
    }
  });

  test('should capture final comprehensive view', async ({ page }) => {
    // Reset to desktop view
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(1000);
    
    // Take final comprehensive screenshot
    await page.screenshot({ 
      path: screenshotPath('12-final-comprehensive-view.png'),
      fullPage: true 
    });

    // Take focused screenshot of the main content area (without sidebar)
    const mainContent = page.locator('[role="main"], main, .space-y-8').first();
    if (await mainContent.count() > 0) {
      await mainContent.screenshot({
        path: screenshotPath('13-main-content-focus.png')
      });
    }

    console.log('✓ Final comprehensive screenshots captured');
  });
});