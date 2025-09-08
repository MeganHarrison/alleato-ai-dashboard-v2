#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import time
import os

# Create screenshots directory if it doesn't exist
os.makedirs('.playwright-mcp', exist_ok=True)

def test_dashboard_page():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1440, 'height': 900},
            device_scale_factor=2
        )
        page = context.new_page()
        
        # Navigate to dashboard page
        print("Navigating to dashboard page...")
        page.goto('http://localhost:3010/', wait_until='domcontentloaded')
        
        # Wait for page to load
        page.wait_for_load_state('networkidle')
        
        # Check if page loaded successfully
        try:
            # Wait for main content to appear
            page.wait_for_selector('h1', timeout=5000)
            print("✓ Dashboard page loaded successfully")
            
            # Check for error boundary
            error_element = page.query_selector('text="Something went wrong"')
            if error_element:
                print("✗ Error boundary triggered on dashboard")
                page.screenshot(path='.playwright-mcp/dashboard-error.png', full_page=True)
                return False
            
            # Take screenshot of successful load
            page.screenshot(path='.playwright-mcp/dashboard-success.png', full_page=True)
            print("✓ Dashboard screenshot captured")
            
            # Test meetings page as well
            print("\nNavigating to meetings page...")
            page.goto('http://localhost:3010/meetings', wait_until='domcontentloaded')
            page.wait_for_load_state('networkidle')
            
            # Wait for table to appear
            try:
                page.wait_for_selector('table', timeout=5000)
                print("✓ Meetings page loaded successfully")
                page.screenshot(path='.playwright-mcp/meetings-page-final.png', full_page=True)
            except:
                print("✗ Failed to load meetings table")
                page.screenshot(path='.playwright-mcp/meetings-error.png', full_page=True)
            
        except Exception as e:
            print(f"✗ Error loading dashboard: {e}")
            page.screenshot(path='.playwright-mcp/dashboard-load-error.png', full_page=True)
            return False
        
        browser.close()
        print("\n✅ All tests completed successfully!")
        return True

if __name__ == "__main__":
    try:
        test_dashboard_page()
    except Exception as e:
        print(f"Error running tests: {e}")