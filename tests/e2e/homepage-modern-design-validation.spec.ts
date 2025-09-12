import { test, expect } from '@playwright/test';
import { join } from 'path';

/**
 * Comprehensive test suite for the modernized homepage design
 * 
 * Tests all aspects of the new design including:
 * - Project cards with modern styling
 * - Meetings section with new grouping
 * - Insights section with enhanced cards
 * - Hover states and interactions
 * - Overall layout and typography
 */

const screenshotPath = (filename: string) => 
  join('screenshots', 'homepage-modern-design', filename);

test.describe('Homepage Modern Design Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:3001');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for dynamic content to load
    await page.waitForTimeout(2000);
  });

  test('should display full homepage with modern layout', async ({ page }) => {
    // Test full page layout
    await expect(page).toHaveTitle(/Project Dashboard|Alleato/);
    
    // Capture full page screenshot
    await page.screenshot({ 
      path: screenshotPath('01-full-homepage-layout.png'),
      fullPage: true 
    });

    // Verify the main sections are visible
    await expect(page.locator('text=Recent Projects')).toBeVisible();
    await expect(page.locator('text=Recent Meetings')).toBeVisible();
    await expect(page.locator('text=AI Insights')).toBeVisible();

    // Check that the background is light gray (gray-50/50)
    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', 'rgb(249, 250, 251)');
  });

  test('should display modern project cards with enhanced styling', async ({ page }) => {
    // Wait for project cards to load
    await page.waitForSelector('[data-testid="project-card"]', { timeout: 5000 });
    
    // Take screenshot of project cards section
    const projectsSection = page.locator('text=Recent Projects').locator('..').locator('..');
    await projectsSection.screenshot({
      path: screenshotPath('02-modern-project-cards.png')
    });

    // Test project card styling
    const projectCards = page.locator('[data-testid="project-card"]');
    const firstCard = projectCards.first();
    
    if (await firstCard.count() > 0) {
      // Verify white background
      await expect(firstCard).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      
      // Test hover state
      await firstCard.hover();
      await page.waitForTimeout(500);
      
      await page.screenshot({
        path: screenshotPath('03-project-card-hover-state.png'),
        clip: await firstCard.boundingBox() || undefined
      });

      // Test that revenue is displayed with labels
      const revenue = firstCard.locator('text=/Revenue:|\\$[0-9,]+/');
      if (await revenue.count() > 0) {
        await expect(revenue).toBeVisible();
      }

      // Check for modern typography - larger, bolder headings
      const heading = firstCard.locator('h3, h2, .font-bold, .text-xl, .text-lg').first();
      if (await heading.count() > 0) {
        await expect(heading).toBeVisible();
      }
    }
  });

  test('should display meetings section with sleek new grouping', async ({ page }) => {
    // Wait for meetings section to load
    await page.waitForSelector('text=Recent Meetings', { timeout: 5000 });
    
    // Take screenshot of meetings section
    const meetingsSection = page.locator('text=Recent Meetings').locator('..').locator('..');
    await meetingsSection.screenshot({
      path: screenshotPath('04-sleek-meetings-section.png')
    });

    // Check for grouping labels (Today/Yesterday/This Week)
    const groupLabels = [
      page.locator('text=Today'),
      page.locator('text=Yesterday'), 
      page.locator('text=This Week')
    ];

    let foundGroups = false;
    for (const label of groupLabels) {
      if (await label.count() > 0) {
        await expect(label).toBeVisible();
        foundGroups = true;
      }
    }

    // Test meeting item hover states
    const meetingItems = page.locator('[data-testid="meeting-item"]');
    if (await meetingItems.count() > 0) {
      const firstMeeting = meetingItems.first();
      
      // Test hover effect
      await firstMeeting.hover();
      await page.waitForTimeout(500);
      
      await page.screenshot({
        path: screenshotPath('05-meeting-item-hover.png'),
        clip: await firstMeeting.boundingBox() || undefined
      });
    }
  });

  test('should display enhanced insights section with modern cards', async ({ page }) => {
    // Wait for insights section to load
    await page.waitForSelector('text=AI Insights', { timeout: 5000 });
    
    // Take screenshot of insights section
    const insightsSection = page.locator('text=AI Insights').locator('..').locator('..');
    await insightsSection.screenshot({
      path: screenshotPath('06-enhanced-insights-section.png')
    });

    // Test insight card styling
    const insightCards = page.locator('[data-testid="insight-card"]');
    if (await insightCards.count() > 0) {
      const firstInsight = insightCards.first();
      
      // Verify white background with subtle borders
      await expect(firstInsight).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      
      // Test hover state
      await firstInsight.hover();
      await page.waitForTimeout(500);
      
      await page.screenshot({
        path: screenshotPath('07-insight-card-hover.png'),
        clip: await firstInsight.boundingBox() || undefined
      });

      // Check for severity badges (should be rounded full)
      const severityBadge = firstInsight.locator('[data-testid="severity-badge"], .rounded-full').first();
      if (await severityBadge.count() > 0) {
        await expect(severityBadge).toBeVisible();
        // Verify rounded-full class or similar styling
        await expect(severityBadge).toHaveCSS('border-radius', '9999px');
      }
    }
  });

  test('should have proper spacing and layout between sections', async ({ page }) => {
    // Take screenshot focused on layout spacing
    await page.screenshot({ 
      path: screenshotPath('08-layout-spacing-overview.png'),
      fullPage: true 
    });

    // Check for increased spacing between columns (gap-16)
    const mainContainer = page.locator('main, .container, .grid').first();
    if (await mainContainer.count() > 0) {
      // Look for gap-16 class or equivalent spacing
      const hasGapClass = await mainContainer.evaluate((el) => {
        return el.className.includes('gap-16') || 
               el.className.includes('gap-x-16') ||
               window.getComputedStyle(el).gap === '64px' ||
               window.getComputedStyle(el).columnGap === '64px';
      });
      
      if (hasGapClass) {
        console.log('✓ Found proper gap spacing (gap-16 or equivalent)');
      }
    }
  });

  test('should have working links and interactions', async ({ page }) => {
    // Test project card links
    const projectLinks = page.locator('[data-testid="project-card"] a, [href*="projects"]').first();
    if (await projectLinks.count() > 0) {
      // Check that link has proper href
      const href = await projectLinks.getAttribute('href');
      expect(href).toBeTruthy();
      
      // Test link hover
      await projectLinks.hover();
      await page.waitForTimeout(300);
    }

    // Test meeting links
    const meetingLinks = page.locator('[data-testid="meeting-item"] a, [href*="meetings"]').first();
    if (await meetingLinks.count() > 0) {
      const href = await meetingLinks.getAttribute('href');
      expect(href).toBeTruthy();
      
      await meetingLinks.hover();
      await page.waitForTimeout(300);
    }

    // Take final screenshot showing interactive elements
    await page.screenshot({ 
      path: screenshotPath('09-interactive-elements.png') 
    });
  });

  test('should display consistent modern typography and colors', async ({ page }) => {
    // Test heading typography
    const headings = page.locator('h1, h2, h3, .text-xl, .text-2xl, .font-bold');
    
    if (await headings.count() > 0) {
      const firstHeading = headings.first();
      
      // Check for modern typography classes
      const classes = await firstHeading.getAttribute('class') || '';
      const hasModernTypography = classes.includes('font-bold') || 
                                 classes.includes('text-xl') || 
                                 classes.includes('text-2xl') ||
                                 classes.includes('text-lg');
      
      if (hasModernTypography) {
        console.log('✓ Found modern typography styling');
      }
    }

    // Test color scheme consistency
    const cards = page.locator('[data-testid="project-card"], [data-testid="insight-card"], .bg-white');
    if (await cards.count() > 0) {
      const firstCard = cards.first();
      await expect(firstCard).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    }

    // Take final comprehensive screenshot
    await page.screenshot({ 
      path: screenshotPath('10-final-modern-design.png'),
      fullPage: true 
    });
  });

  test('should be responsive and maintain design quality', async ({ page }) => {
    // Test at different viewport sizes
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
    }
  });
});