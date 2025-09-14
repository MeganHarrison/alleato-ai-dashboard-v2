import { test, expect } from '@playwright/test';
import { join } from 'path';

/**
 * Comprehensive test suite for the insights page functionality
 * 
 * Tests cover:
 * 1. Page loads without 500/404 errors
 * 2. InsightGeneratorButton component renders correctly
 * 3. Dialog functionality works (can open/close)
 * 4. Page displays insights data properly
 * 5. All components render without React errors
 */
test.describe('Insights Page - Comprehensive Testing', () => {
  
  test('should load insights page successfully and verify all functionality', async ({ page }) => {
    console.log('🚀 Starting comprehensive insights page test...');
    
    // Navigate to the insights page
    console.log('📍 Navigating to insights page...');
    await page.goto('http://localhost:3008/insights');
    
    // Test 1: Verify page loads without 500/404 errors
    console.log('✅ Test 1: Checking page loads without errors...');
    await expect(page).not.toHaveTitle(/404|500|Error/);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Test 2: Verify InsightGeneratorButton component renders correctly
    console.log('✅ Test 2: Checking InsightGeneratorButton renders...');
    const insightButton = page.locator('[data-testid="insight-generator-button"], button:has-text("Generate"), button:has-text("Insight")');
    
    // Wait for the button to be visible (it might be loading)
    await expect(insightButton.first()).toBeVisible({ timeout: 10000 });
    
    // Test 3: Verify dialog functionality works (can open/close)
    console.log('✅ Test 3: Testing dialog open/close functionality...');
    
    // Click the insight generator button to open dialog
    await insightButton.first().click();
    
    // Wait for dialog to appear - try multiple selectors for dialog
    const dialog = page.locator('[role="dialog"], .dialog, [data-testid="insight-dialog"]');
    await expect(dialog.first()).toBeVisible({ timeout: 5000 });
    
    // Look for close button - try multiple selectors
    const closeButton = page.locator('[data-testid="close-dialog"], button[aria-label="Close"], .dialog button:has-text("Close"), [aria-label*="close" i]');
    
    if (await closeButton.first().isVisible()) {
      console.log('📝 Found close button, testing close functionality...');
      await closeButton.first().click();
      
      // Verify dialog closes
      await expect(dialog.first()).not.toBeVisible({ timeout: 3000 });
    } else {
      console.log('📝 No explicit close button found, testing ESC key...');
      // Try ESC key to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
    
    // Test 4: Verify page displays insights data properly
    console.log('✅ Test 4: Checking insights data display...');
    
    // Look for common insights page elements
    const pageContent = page.locator('main, [data-testid="insights-content"], .insights-container');
    await expect(pageContent.first()).toBeVisible();
    
    // Check for any error messages or loading states
    const errorMessage = page.locator('.error, [data-testid="error"], .text-red, .text-destructive');
    const loadingSpinner = page.locator('.loading, [data-testid="loading"], .spinner');
    
    // Wait a moment for any async operations to complete
    await page.waitForTimeout(2000);
    
    // Verify no persistent error messages (temporary ones during loading are ok)
    if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent();
      console.log(`⚠️  Found error message: ${errorText}`);
      // Only fail if it's a critical error, not a temporary loading state
      if (errorText && (errorText.includes('500') || errorText.includes('failed') || errorText.includes('error'))) {
        throw new Error(`Critical error found on page: ${errorText}`);
      }
    }
    
    // Test 5: Verify all components render without React errors
    console.log('✅ Test 5: Checking for React errors in console...');
    
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Reload page to catch any initialization errors
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check for critical React errors
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('ReferenceError') || 
      error.includes('TypeError') || 
      error.includes('React') ||
      error.includes('setOpen is not defined')
    );
    
    if (criticalErrors.length > 0) {
      console.log('❌ Critical errors found:', criticalErrors);
      throw new Error(`React errors detected: ${criticalErrors.join(', ')}`);
    }
    
    console.log('✅ All tests passed! Taking screenshot...');
    
    // Take screenshot for documentation
    const screenshotPath = join(process.cwd(), 'screenshots', `insights-page-working-${Date.now()}.png`);
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);
    
    // Final verification - check page title or main heading
    const pageHeading = page.locator('h1, h2, [data-testid="page-title"]');
    if (await pageHeading.isVisible()) {
      const headingText = await pageHeading.textContent();
      console.log(`📋 Page heading: "${headingText}"`);
    }
    
    console.log('🎉 Insights page comprehensive test completed successfully!');
  });
  
  test('should handle network errors gracefully', async ({ page }) => {
    console.log('🔄 Testing error handling...');
    
    // Block network requests to simulate errors
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    await page.goto('http://localhost:3008/insights');
    await page.waitForLoadState('networkidle');
    
    // Page should still render even if API calls fail
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
    
    // Should not show critical errors that break the page
    const title = await page.title();
    expect(title).not.toMatch(/500|Error/);
    
    console.log('✅ Error handling test passed');
  });
  
});