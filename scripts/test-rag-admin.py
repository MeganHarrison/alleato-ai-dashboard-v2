#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import time
import os

# Create screenshots directory if it doesn't exist
os.makedirs('.playwright-mcp', exist_ok=True)

def capture_rag_admin():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1440, 'height': 900},
            device_scale_factor=2
        )
        page = context.new_page()
        
        # Navigate to RAG admin page
        print("Navigating to RAG admin page...")
        page.goto('http://localhost:3001/rag-admin')
        
        # Wait for page to load
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        
        # Take screenshot of the initial view
        page.screenshot(path='.playwright-mcp/rag-admin-overview.png', full_page=True)
        print("✓ Captured overview screenshot")
        
        # Click on Fireflies Sync tab
        try:
            page.click('button:has-text("Fireflies Sync")', timeout=5000)
            time.sleep(1)
            page.screenshot(path='.playwright-mcp/rag-admin-fireflies.png', full_page=True)
            print("✓ Captured Fireflies sync tab")
        except:
            print("Could not find Fireflies Sync tab")
        
        # Click on Vectorization tab
        try:
            page.click('button:has-text("Vectorization")', timeout=5000)
            time.sleep(1)
            page.screenshot(path='.playwright-mcp/rag-admin-vectorization.png', full_page=True)
            print("✓ Captured Vectorization tab")
        except:
            print("Could not find Vectorization tab")
        
        # Click on Insights tab
        try:
            page.click('button:has-text("Insights")', timeout=5000)
            time.sleep(1)
            page.screenshot(path='.playwright-mcp/rag-admin-insights.png', full_page=True)
            print("✓ Captured Insights tab")
        except:
            print("Could not find Insights tab")
        
        # Click on Manual Upload tab
        try:
            page.click('button:has-text("Manual Upload")', timeout=5000)
            time.sleep(1)
            page.screenshot(path='.playwright-mcp/rag-admin-manual-upload.png', full_page=True)
            print("✓ Captured Manual Upload tab")
        except:
            print("Could not find Manual Upload tab")
        
        browser.close()
        print("\n✅ All screenshots captured successfully!")

if __name__ == "__main__":
    try:
        capture_rag_admin()
    except Exception as e:
        print(f"Error capturing screenshots: {e}")