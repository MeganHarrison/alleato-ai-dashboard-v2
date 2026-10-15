import { test, expect } from '@playwright/test';

/**
 * Final screenshot test to capture the ASRS form with updated progress section
 */

test('capture ASRS form with 4-step progress section', async ({ page }) => {
  console.log('🚀 Capturing final ASRS form screenshot...');
  
  // Navigate to the ASRS form
  await page.goto('http://localhost:3001/asrs-form-3');
  await page.waitForLoadState('networkidle');
  
  // Wait a bit more for any dynamic content
  await page.waitForTimeout(2000);
  
  // Take comprehensive screenshot showing the 4-step progress and form
  await page.screenshot({ 
    path: 'screenshots/asrs-form-4-step-progress-final.png', 
    fullPage: true 
  });
  
  // Also take a focused screenshot of just the progress section
  const progressSection = page.locator('.mx-auto.px-4.py-6').first();
  await progressSection.screenshot({ 
    path: 'screenshots/asrs-form-progress-only-final.png'
  });
  
  console.log('✅ Screenshots captured successfully!');
  console.log('📸 Files saved:');
  console.log('   - screenshots/asrs-form-4-step-progress-final.png');
  console.log('   - screenshots/asrs-form-progress-only-final.png');
});