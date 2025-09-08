# Duplicate Prevention Implementation for AI Insights

## Overview
Implemented a comprehensive duplicate prevention mechanism for the `ai_insights` table to prevent duplicate insights from being created when processing documents or meetings.

## Problem
The system was creating duplicate insights when:
- Processing the same document multiple times
- Re-running insight generation scripts
- Multiple processes attempting to create the same insights

## Solution

### 1. Database Migration
Created migration file: `supabase/migrations/20250908_prevent_duplicate_insights.sql`

This migration adds:
- **content_hash column**: MD5 hash of meeting_id + insight_type + normalized title
- **Trigger function**: Automatically generates hash on insert/update
- **Unique index**: Prevents duplicate hashes from being inserted
- **Helper function**: `check_insight_duplicate()` to pre-check for duplicates
- **Monitoring view**: `duplicate_insight_attempts` to track duplicate attempts

### 2. Script Updates
Updated `scripts/generate-insights-workaround.ts` to:
- Use `meeting_id` instead of `document_id` (correct field name)
- Handle duplicate errors gracefully
- Count and report duplicates vs new insertions
- Add proper error handling for each insight type

### 3. Testing Tools
Created utility scripts:
- `scripts/test-duplicate-prevention.ts`: Tests if duplicate prevention is active
- `scripts/output-migration-sql.ts`: Outputs SQL for manual execution
- `scripts/apply-duplicate-prevention.ts`: Attempts to apply migration programmatically

## How It Works

### Hash Generation
Each insight gets a unique hash based on:
```sql
MD5(CONCAT(
  COALESCE(meeting_id::text, ''),
  '_',
  insight_type,
  '_',
  LOWER(TRIM(title))
))
```

This ensures that insights with the same meeting, type, and title are considered duplicates.

### Automatic Prevention
The database trigger automatically:
1. Generates the hash before insert/update
2. The unique index blocks duplicates at the database level
3. Returns an error that the application can handle gracefully

## Usage

### Apply the Migration
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the migration SQL from `supabase/migrations/20250908_prevent_duplicate_insights.sql`
4. Or use: `npx tsx scripts/output-migration-sql.ts` to get the SQL

### Test the Implementation
```bash
# Test if duplicate prevention is working
npx tsx scripts/test-duplicate-prevention.ts

# Run insight generation (will skip duplicates)
npx tsx scripts/generate-insights-workaround.ts
```

### Monitor Duplicates
After applying the migration, you can query the monitoring view:
```sql
SELECT * FROM duplicate_insight_attempts;
```

## Benefits
1. **Data Integrity**: No duplicate insights in the database
2. **Performance**: Reduced storage and faster queries
3. **Idempotency**: Scripts can be re-run safely without creating duplicates
4. **Monitoring**: Track duplicate attempts for debugging

## Error Handling
The updated scripts handle duplicate errors gracefully:
- Count duplicates separately from new insertions
- Continue processing even if duplicates are encountered
- Report summary of insertions vs duplicates

## Future Improvements
1. Could extend hash to include more fields if needed
2. Could add a cleanup script to remove existing duplicates
3. Could add more sophisticated duplicate detection (semantic similarity)

## Related Files
- Migration: `/supabase/migrations/20250908_prevent_duplicate_insights.sql`
- Test Script: `/scripts/test-duplicate-prevention.ts`
- Generation Script: `/scripts/generate-insights-workaround.ts`
- SQL Output: `/scripts/output-migration-sql.ts`