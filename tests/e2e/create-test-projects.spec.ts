import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.describe('Create Test Projects', () => {
  test('create test projects in database', async ({ page }) => {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lgveqfnpkxvzbnnwuled.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmxxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MDM0NTgsImV4cCI6MjA0ODM3OTQ1OH0.2K8zGrbfQVV-_p3AgLxDh-PmMEj9zRO06Y2Z-JPtcCw'
    );
    
    console.log('Creating test projects...');
    
    // Create test projects
    const testProjects = [
      {
        name: 'Test Current Project 1',
        phase: 'Current',
        type: 'Development',
        description: 'This is a test current project for routing tests',
        'est revenue': 150000,
        location: 'New York, NY',
        address: '123 Test St',
        state: 'NY'
      },
      {
        name: 'Test Current Project 2',
        phase: 'Current',
        type: 'Consulting',
        description: 'Another test current project',
        'est revenue': 250000,
        location: 'Los Angeles, CA',
        address: '456 Demo Ave',
        state: 'CA'
      },
      {
        name: 'Test Planning Project',
        phase: 'Planning',
        type: 'Research',
        description: 'A project in planning phase',
        'est revenue': 100000,
        location: 'Chicago, IL',
        address: '789 Planning Rd',
        state: 'IL'
      }
    ];
    
    const { data, error } = await supabase
      .from('projects')
      .insert(testProjects)
      .select();
    
    if (error) {
      console.error('Error creating projects:', error);
    } else {
      console.log('Created projects:', data);
    }
    
    // Now navigate to the dashboard and verify
    await page.goto('http://localhost:3001/projects-dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if projects are visible
    const projectLinks = await page.locator('a[href^="/projects/"]').count();
    console.log('Projects visible after creation:', projectLinks);
    
    await page.screenshot({ path: 'after-creating-projects.png', fullPage: true });
    
    expect(projectLinks).toBeGreaterThan(0);
  });
});