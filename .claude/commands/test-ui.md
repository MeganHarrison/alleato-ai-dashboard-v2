## 📁 **.claude/commands/test-ui.md**

```markdown
# UI TESTING CHECKLIST

Test the following UI scenarios in the browser:

## AI CHAT TESTING
1. Send a simple message - verify streaming response
2. Send a complex query - verify structured response
3. Test tool calling - verify function execution
4. Check persistence - refresh and verify history
5. Test error handling - disconnect network
6. Verify markdown rendering
7. Test code highlighting
8. Check mobile responsiveness
9. Verify dark mode styling

## TABLE TESTING  
1. Load table with data from Supabase
2. Test sorting - each column
3. Test filtering - text, number, date
4. Test pagination - next, previous, jump
5. Test inline editing - save changes
6. Test bulk actions - select multiple
7. Test export - CSV, Excel
8. Verify real-time updates
9. Test error states - network failure
10. Check loading states

## DASHBOARD TESTING
1. Verify all widgets load
2. Test data refresh - pull to refresh
3. Check chart interactions
4. Test date range filters
5. Verify metric calculations
6. Test drill-down navigation
7. Check responsive grid layout
8. Verify print layout
9. Test export functionality

## ACCESSIBILITY TESTING
1. Tab through entire interface
2. Test with screen reader
3. Verify focus indicators
4. Check ARIA labels
5. Test keyboard shortcuts
6. Verify color contrast
7. Test with keyboard only
8. Check skip links

Report any issues found with specific reproduction steps.