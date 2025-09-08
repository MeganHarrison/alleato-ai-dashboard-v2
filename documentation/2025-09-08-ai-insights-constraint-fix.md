# AI Insights Foreign Key Constraint Fix - Summary

## Date: 2025-09-08

## Problem
The `ai_insights` table had a foreign key constraint requiring `meeting_id` to exist in the `meetings` table, but the system was transitioning to use `documents` instead of meetings, causing constraint violations when trying to create insights for documents.

## Analysis Findings

### 1. Original Constraints on `ai_insights` Table
- **Primary Key**: `ai_insights_pkey` on `id`
- **Foreign Keys**:
  - `ai_insights_meeting_id_fkey`: References `meetings(id)` with CASCADE on UPDATE and DELETE
  - `ai_insights_project_id_fkey`: References `projects(id)` with CASCADE on UPDATE and DELETE

### 2. Original Table Structure
- `meeting_id` (UUID) - Was nullable, referenced meetings table
- No `document_id` column existed
- 329 existing insights all linked to meetings
- No orphaned insights found (all meeting_ids were valid)

## Solution Implemented

### Approach: Dual Relationship (Flexible)
We chose to implement a dual relationship approach that:
1. Keeps the existing `meeting_id` relationship intact
2. Adds a new `document_id` column and foreign key
3. Allows insights to be associated with either meetings OR documents
4. Preserves all existing data without migration

### Migration Steps Executed

1. **Made `meeting_id` nullable** (was already nullable, so skipped)

2. **Added `document_id` column**
   ```sql
   ALTER TABLE ai_insights ADD COLUMN document_id UUID;
   ```

3. **Added foreign key constraint to documents**
   ```sql
   ALTER TABLE ai_insights 
   ADD CONSTRAINT ai_insights_document_id_fkey 
   FOREIGN KEY (document_id) 
   REFERENCES documents(id) 
   ON DELETE CASCADE;
   ```

4. **Added check constraint for parent relationship**
   ```sql
   ALTER TABLE ai_insights 
   ADD CONSTRAINT ai_insights_has_parent_check 
   CHECK (
     (meeting_id IS NOT NULL AND document_id IS NULL) OR 
     (meeting_id IS NULL AND document_id IS NOT NULL) OR
     (meeting_id IS NULL AND document_id IS NULL) -- Allow both null during transition
   );
   ```

5. **Created performance index**
   ```sql
   CREATE INDEX idx_ai_insights_document_id ON ai_insights(document_id);
   ```

## Results

### Final State
- ✅ Both `meeting_id` and `document_id` columns exist
- ✅ Both are nullable to allow flexibility
- ✅ Foreign key constraints properly configured for both relationships
- ✅ Check constraint prevents insights from having both IDs set
- ✅ Performance index created for document_id lookups
- ✅ All 329 existing meeting insights preserved
- ✅ Successfully created 100+ new document insights

### Statistics After Fix
- Total Insights: 429+
- Meeting-only Insights: 329
- Document-only Insights: 100+
- Insights with both IDs: 0 (prevented by check constraint)
- Insights with neither ID: 0

## Code Updates Required

### 1. TypeScript Types
```typescript
export interface AiInsight {
  id: number;
  project_id?: number;
  meeting_id?: string;  // Now optional
  document_id?: string; // New field
  // ... other fields
}
```

### 2. Creating Insights for Documents
```typescript
const { data, error } = await supabase
  .from('ai_insights')
  .insert({
    document_id: documentId,  // Use document_id
    meeting_id: null,         // Explicitly null
    // ... other fields
  });
```

### 3. Querying Insights with Joins
```typescript
const { data } = await supabase
  .from('ai_insights')
  .select(`
    *,
    meetings (id, title, date),
    documents (id, title, type)
  `);
```

## Scripts Created

1. **`analyze-ai-insights-constraints.ts`** - Analyzes current constraints
2. **`query-constraints-direct.ts`** - Direct PostgreSQL queries for detailed analysis
3. **`fix-ai-insights-constraints.ts`** - Executes the migration safely
4. **`verify-document-insights.ts`** - Verifies the fix and provides statistics
5. **Updated `generate-insights-workaround.ts`** - Now uses `document_id` instead of `meeting_id`

## Implications

### Advantages of This Approach
- ✅ No data loss - all existing insights preserved
- ✅ Backward compatible - existing code using meeting_id continues to work
- ✅ Forward compatible - new code can use document_id
- ✅ Flexible - supports gradual migration from meetings to documents
- ✅ Referential integrity maintained with proper foreign keys

### Considerations
- Applications need to handle both relationship types
- Queries may need to check both meeting and document relationships
- Future migration path to document-only can be implemented when ready

## Next Steps

1. ✅ Update TypeScript types in the application
2. ✅ Update insight generation code to use `document_id`
3. ⏳ Test insight creation through the application UI
4. ⏳ Consider migrating historical meeting insights to documents if applicable
5. ⏳ Monitor for any issues with the dual relationship approach

## Files Modified

- Database schema: `ai_insights` table structure
- `/scripts/generate-insights-workaround.ts` - Updated to use document_id
- Created multiple analysis and migration scripts in `/scripts/`

## Validation

The fix was validated by:
1. Successfully creating new insights with `document_id`
2. Verifying check constraint prevents invalid states
3. Confirming all existing data remains intact
4. Testing foreign key relationships work correctly
5. Confirming no orphaned records exist

This migration provides a robust solution that maintains data integrity while enabling the transition from meeting-based to document-based insights.