# Manual Test Plan - Employees Page

## Test Date: August 28, 2025

### Test Setup
1. Ensure Next.js dev server is running on port 3006
2. Ensure you're logged into the application
3. Navigate to http://localhost:3006/employees

### Test Checklist

#### Page Load
- [ ] Page loads without errors
- [ ] No console errors in browser DevTools
- [ ] Page title shows "Employees"
- [ ] Page description shows "Manage your company employees and their information"

#### Data Display
- [ ] Employee data from Supabase is displayed in table format
- [ ] The following employees should be visible (from database):
  - Brandon Clymer (Leadership department)
  - 2 other employee records

#### Table Columns
- [ ] Name column shows first and last name
- [ ] Department column shows department badges
- [ ] Contact column shows email/phone if available
- [ ] Start Date column shows formatted dates
- [ ] Salary column shows formatted currency
- [ ] Allowances column shows truck/phone/card allowances
- [ ] Actions column shows dropdown menu

#### Search Functionality
- [ ] Search bar is visible and functional
- [ ] Searching by name filters results correctly
- [ ] Searching by department filters results correctly
- [ ] Searching by email filters results correctly
- [ ] Clear search shows all employees again

#### UI Elements
- [ ] Table has proper styling with borders
- [ ] Badges for departments display correctly
- [ ] Icons display correctly (Mail, Phone, Calendar, etc.)
- [ ] Dropdown menu opens on click
- [ ] Table shows count of filtered/total employees at bottom

#### Responsive Design
- [ ] Table is responsive on smaller screens
- [ ] Padding adjusts properly (p-4 on mobile, p-6 on desktop)

### Expected Data from Database
Based on the database query, you should see:
1. **Brandon Clymer**
   - Department: Leadership
   - Other fields may be null/empty
   
2. **Two additional employee records** (names not shown in sample)

### Common Issues to Check
1. **No data showing**: Check Supabase connection and RLS policies
2. **Authentication redirect**: Ensure you're logged in
3. **Type errors**: Check that all nullable fields are handled properly
4. **Styling issues**: Verify Tailwind classes are working

### How to Verify Success
1. Open browser DevTools Console
2. Navigate to http://localhost:3006/employees
3. Verify no errors in console
4. Verify employee data displays correctly
5. Test search functionality
6. Click on action menu dropdowns

### Notes
- The employees table has 3 records in the database
- Some fields like email, phone, salary may be null
- The "salery" field has a typo in the database schema (should be "salary")