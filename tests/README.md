# PM Assistant Tests

## Overview
This directory contains tests for the PM Assistant feature with auto-initialization functionality.

## Test Files
- `test-pm-ui.html` - Manual UI test checklist
- `test-auto-init.md` - Auto-initialization behavior documentation  
- `test-pm-basic.ts` - Basic unit tests for RAG services
- `e2e/pm-assistant.spec.ts` - Full E2E Playwright tests
- `auto-init-test-summary.md` - Summary of test updates

## Running Tests

### Prerequisites
1. Ensure dev server is running: `npm run dev`
2. Set up test credentials in `.env.local`:
   ```
   TEST_EMAIL=your-test-email@example.com
   TEST_PASSWORD=your-test-password
   ```

### Manual Testing
1. Open `tests/test-pm-ui.html` in your browser
2. Navigate to http://localhost:3000/pm-assistant in another tab
3. Follow the test checklist in the HTML file
4. Verify auto-initialization behavior:
   - Page shows "Initializing PM Assistant..." immediately
   - No button click required
   - Chat interface appears automatically

### Automated E2E Testing
```bash
# Run all PM Assistant tests
npx playwright test e2e/pm-assistant.spec.ts

# Run specific test
npx playwright test -g "auto-initialize"

# Run in UI mode for debugging
npx playwright test --ui

# Run with specific base URL
PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test
```

### Unit Testing
```bash
# Run basic functionality tests
npx ts-node tests/test-pm-basic.ts
```

## Expected Behavior

### Auto-Initialization Flow
1. User navigates to `/pm-assistant`
2. Loading state appears immediately ("Initializing PM Assistant...")
3. Chat ID is created automatically in the background
4. Loading disappears and chat interface appears
5. User can immediately start chatting (zero-click experience)

### Error Handling
- If initialization fails, shows error message
- Provides "Refresh Page" button to retry
- No confusing blank states

## Authentication
Tests handle authentication automatically:
- If redirected to login, uses TEST_EMAIL and TEST_PASSWORD
- Waits for redirect back to PM Assistant
- Continues with normal test flow

## Troubleshooting

### Common Issues
1. **404 Error**: Ensure dev server is running and check the port
2. **Authentication Error**: Verify TEST_EMAIL and TEST_PASSWORD are valid
3. **Timeout Errors**: Increase timeout values in test configuration
4. **Loading State Not Found**: Check that auto-initialization is properly implemented

### Debug Tips
- Use `npx playwright test --debug` for step-by-step debugging
- Check `test-results` folder for screenshots on failure
- Look at browser console for JavaScript errors
- Verify network requests in browser DevTools