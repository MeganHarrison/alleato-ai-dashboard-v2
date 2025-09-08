import { test } from '@playwright/test';

test('Find existing projects', async ({ page }) => {
  test.setTimeout(60000);
  
  console.log('🔍 Looking for existing projects...');
  
  try {
    // Navigate to projects list page first
    console.log('📍 Going to projects page...');
    await page.goto('http://localhost:3010/projects', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    
    // Take screenshot of projects page
    await page.screenshot({ 
      path: 'screenshots/projects-list.png',
      fullPage: true 
    });
    console.log('📸 Projects list screenshot taken');
    
    // Look for project links
    const projectLinks = await page.locator('a[href*="/projects/"]').count();
    console.log('🔗 Project links found:', projectLinks);
    
    if (projectLinks > 0) {
      // Get all project links
      const links = await page.locator('a[href*="/projects/"]').all();
      console.log('📄 Found project links:');
      
      for (let i = 0; i < Math.min(links.length, 5); i++) {
        const href = await links[i].getAttribute('href');
        const text = await links[i].textContent();
        console.log(`   ${i + 1}. ${href} - "${text?.trim()}"`);
      }
      
      // Try the first project link
      if (links.length > 0) {
        const firstProjectHref = await links[0].getAttribute('href');
        console.log(`🎯 Testing first project: ${firstProjectHref}`);
        
        await page.goto(`http://localhost:3010${firstProjectHref}`, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        await page.waitForTimeout(3000);
        
        // Take screenshot of the actual project page
        await page.screenshot({ 
          path: 'screenshots/project-page-real.png',
          fullPage: true 
        });
        console.log('📸 Real project page screenshot taken');
        
        // Now check for Documents section
        const documentsText = await page.locator('text=Documents').count();
        console.log('📄 "Documents" text found on real project:', documentsText);
        
        const tables = await page.locator('table').count();
        console.log('📋 Tables found on real project:', tables);
        
        const h2Elements = await page.locator('h2').allTextContents();
        console.log('🏷️ H2 elements on real project:', h2Elements);
      }
    } else {
      console.log('⚠️ No project links found on projects page');
    }
    
  } catch (error) {
    console.error('❌ Error finding projects:', error);
    
    try {
      await page.screenshot({ 
        path: 'screenshots/projects-error.png',
        fullPage: true 
      });
    } catch (e) {
      console.error('Could not take error screenshot');
    }
    
    throw error;
  }
});