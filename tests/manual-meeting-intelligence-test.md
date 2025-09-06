# Meeting Intelligence System - Manual Test Checklist

## Prerequisites
- [ ] Dev server running on http://localhost:3006
- [ ] User is logged in to the application
- [ ] Supabase storage bucket "meetings" exists
- [ ] Database migrations have been applied

## Test 1: Page Load and Navigation
1. Navigate to http://localhost:3006/meeting-intelligence
2. **Expected Results:**
   - [ ] Page loads without errors
   - [ ] Title shows "Meeting Intelligence | Alleato AI"
   - [ ] Main heading shows "Meeting Intelligence"
   - [ ] Subtitle shows "AI-powered insights from all your team meetings"

## Test 2: Statistics Cards
**On the Meeting Intelligence page:**
- [ ] "Total Meetings" card displays (should show 281 based on current data)
- [ ] "This Week" card displays
- [ ] "Action Items" card displays
- [ ] "Identified Risks" card displays

## Test 3: Tab Navigation
**Click through each tab:**
- [ ] "AI Assistant" tab is visible and clickable
- [ ] "All Meetings" tab is visible and clickable
- [ ] "Upload" tab is visible and clickable

## Test 4: AI Assistant Tab
**When "AI Assistant" tab is active:**
- [ ] Chat interface is visible
- [ ] Welcome message displays with bullet points of capabilities
- [ ] Input field shows placeholder "Ask about your meetings..."
- [ ] Send button is visible
- [ ] Suggested questions appear (if no chat history)

**Test sending a message:**
1. Type "What meetings do we have?" in the input
2. Click Send
3. **Expected:**
   - [ ] Message appears in chat
   - [ ] Loading indicator shows
   - [ ] AI response appears

## Test 5: All Meetings Tab
**When "All Meetings" tab is active:**
- [ ] Table with meetings displays
- [ ] Search bar is visible with placeholder "Search meetings or participants..."
- [ ] Project filter dropdown is visible
- [ ] Table columns show: Meeting, Date & Time, Duration, Participants, Project, Insights, Actions

**Test search functionality:**
1. Type a search term in the search bar
2. **Expected:**
   - [ ] Table filters in real-time
   - [ ] Only matching meetings show

## Test 6: Upload Tab
**When "Upload" tab is active:**
- [ ] "Upload Meeting Transcript" card displays
- [ ] File upload input is visible
- [ ] "Or" divider appears
- [ ] Textarea for pasting transcript is visible
- [ ] Metadata fields are visible:
   - [ ] Meeting Title
   - [ ] Fireflies ID
   - [ ] Fireflies Link
   - [ ] Participants
- [ ] "Upload & Process" button is visible

**Test upload validation:**
1. Without selecting file or entering text, check button
   - [ ] Button should be disabled
2. Enter text in transcript textarea
   - [ ] Button should become enabled

## Test 7: Upload Functionality
1. Paste sample transcript:
   ```
   Title: Test Meeting
   Date: 2024-08-28
   Duration: 30 minutes
   Participants: John Doe, Jane Smith
   
   John: Let's discuss the project timeline.
   Jane: We need to address the risk of delays.
   John: I'll take the action to review the schedule.
   ```
2. Fill metadata:
   - Title: Test Meeting
   - Participants: John Doe, Jane Smith
3. Click "Upload & Process"
4. **Expected:**
   - [ ] Success message appears
   - [ ] Form clears after successful upload

## Test 8: API Endpoint
1. Open browser console
2. Visit: http://localhost:3006/api/cron/vectorize-meetings
3. **Expected:**
   - [ ] Either JSON response with processing info
   - [ ] Or redirect to login (if not authenticated)

## Test 9: Error Handling
**Test error states:**
- [ ] Try uploading without required fields - should show error
- [ ] Check console for any JavaScript errors - should be none

## Test 10: Responsive Design
**Test on different screen sizes:**
- [ ] Desktop view looks correct
- [ ] Tablet view adapts properly
- [ ] Mobile view is usable

## Known Issues to Check
- [ ] No console errors in browser dev tools
- [ ] All network requests complete successfully
- [ ] No TypeScript errors in terminal

## Performance Checks
- [ ] Page loads within 3 seconds
- [ ] Tab switching is instant
- [ ] Search filters update smoothly

## Test Results Summary
- Total Tests: ___
- Passed: ___
- Failed: ___
- Blocked: ___

## Notes
Add any observations or issues found:

---

**Tested By:** _____________
**Date:** _____________
**Environment:** Development (localhost:3006)