#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import time
import os

# Create screenshots directory if it doesn't exist
os.makedirs('.playwright-mcp', exist_ok=True)

def capture_meetings_page():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1440, 'height': 900},
            device_scale_factor=2
        )
        page = context.new_page()
        
        # Navigate to meetings page
        print("Navigating to meetings page...")
        page.goto('http://localhost:3006/meetings', wait_until='domcontentloaded')
        
        # Wait for page to load
        page.wait_for_load_state('networkidle')
        
        # Wait for table to appear
        try:
            page.wait_for_selector('table', timeout=10000)
            print("Table found on page")
        except:
            print("Table not found, checking for error messages...")
            # Check if there's an error or loading message
            content = page.content()
            if "404" in content:
                print("404 error encountered")
            elif "Loading" in content:
                print("Page is still loading...")
                time.sleep(5)  # Wait longer
        
        time.sleep(2)  # Extra wait for data to load
        
        # Take screenshot of the table view
        page.screenshot(path='.playwright-mcp/meetings-table-view.png', full_page=True)
        print("✓ Captured meetings table view")
        
        # Try to click edit on the first row if it exists
        try:
            # Look for the first edit button
            edit_button = page.locator('button[aria-label*="edit" i]').first
            if edit_button.is_visible():
                edit_button.click()
                time.sleep(1)
                page.screenshot(path='.playwright-mcp/meetings-edit-mode.png', full_page=True)
                print("✓ Captured edit mode")
        except:
            print("No edit button found or couldn't activate edit mode")
        
        browser.close()
        print("\n✅ Screenshots captured successfully!")

if __name__ == "__main__":
    try:
        capture_meetings_page()
    except Exception as e:
        print(f"Error capturing screenshots: {e}")