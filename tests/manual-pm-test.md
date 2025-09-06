# Manual Testing Guide for PM Assistant RAG

## Pre-requisites
1. Ensure the development server is running: `npm run dev`
2. Ensure you're logged in to the application
3. Have the browser developer console open to monitor for errors

## Test 1: Page Load and Initialization
1. Navigate to http://localhost:3000/pm-assistant
2. **Expected**: 
   - Page title shows "AI Project Manager Assistant"
   - "RAG-Enhanced" badge is visible
   - Welcome message describes the assistant's capabilities
   - "Start PM Assistant" button is visible and enabled

## Test 2: Chat Initialization
1. Click "Start PM Assistant" button
2. **Expected**:
   - Chat interface appears
   - Welcome message from assistant is displayed
   - Text input area is visible at bottom
   - Suggested questions are shown

## Test 3: Basic Message Send
1. Type "Hello, can you help me with project management?"
2. Press Enter or click send
3. **Expected**:
   - Message appears in chat history
   - "AI is thinking..." indicator shows
   - Response is received within 60 seconds
   - Response acknowledges the question and offers help

## Test 4: RAG Search Functionality
1. Type "What meetings have been held recently?"
2. Send the message
3. **Expected**:
   - AI attempts to search meeting data
   - Response either shows meeting information OR indicates no meetings found
   - Response references the search attempt

## Test 5: Project Risk Analysis
1. Type "What are the current risks and blockers for my projects?"
2. Send the message
3. **Expected**:
   - AI searches for risk-related information
   - Response provides analysis based on available data
   - If no data, response explains this clearly

## Test 6: Quick Actions
1. Click on "Quick Insights" tab
2. Click on "Project Status" quick action
3. **Expected**:
   - Either populates chat with the template question OR
   - Navigates back to chat tab
   - System remains responsive

## Test 7: Error Handling
1. Send a very long message (copy-paste lorem ipsum 10+ times)
2. **Expected**:
   - System handles gracefully
   - Either processes the message or shows an error
   - Chat remains functional afterward

## Test 8: Multiple Messages
1. Send 3-4 different questions in sequence
2. **Expected**:
   - All messages and responses appear in order
   - Chat history is maintained
   - Scrolling works properly

## Console Checks
During all tests, check browser console for:
- No 404 errors
- No unhandled promise rejections
- No React errors
- API calls to /api/pm-chat are made successfully

## Performance Checks
- Initial page load < 3 seconds
- Chat initialization < 2 seconds
- First response starts streaming < 5 seconds
- UI remains responsive during AI responses

## Issues to Note
Record any of the following:
- Error messages
- Unexpected behavior
- Performance issues
- UI/UX problems
- Missing functionality