# How to Fix the AI Insights Trigger Issue in Supabase

## Problem
The `ai_insights` table has a database trigger that references a non-existent field called `meeting_title`, causing insertions to fail with the error:
```
record "new" has no field "meeting_title"
```

## Solution Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Navigate to your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query" button

3. **Find and Remove the Problematic Trigger**
   - First, run this query to see all triggers on the ai_insights table:
   ```sql
   SELECT 
     trigger_name,
     event_manipulation,
     event_object_table,
     action_statement
   FROM information_schema.triggers
   WHERE event_object_table = 'ai_insights';
   ```

4. **Apply the Fix**
   - Copy the contents of `supabase/migrations/fix_ai_insights_trigger.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

5. **Verify the Fix**
   - Test by inserting a record directly:
   ```sql
   INSERT INTO ai_insights (
     meeting_id,
     insight_type,
     title,
     description,
     severity
   ) VALUES (
     (SELECT id FROM documents LIMIT 1),
     'test',
     'Test Insight',
     'Testing if trigger is fixed',
     'low'
   );
   ```

### Option 2: Using Supabase CLI

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link your project**
   ```bash
   supabase link --project-ref lgveqfnpkxvzbnnwuled
   ```

4. **Run the migration**
   ```bash
   supabase db push
   ```

### Option 3: Quick Emergency Fix (Temporary)

If you need an immediate fix without proper migration:

1. **Open SQL Editor in Supabase Dashboard**

2. **Run this simplified fix**:
   ```sql
   -- Drop only the problematic trigger
   DROP TRIGGER IF EXISTS [trigger_name] ON ai_insights;
   
   -- Drop the trigger function if it exists
   DROP FUNCTION IF EXISTS [function_name]() CASCADE;
   ```
   Replace `[trigger_name]` and `[function_name]` with the actual names found in step 3 of Option 1.

## Alternative: Full Migration to Document-Based System

If you want to fully migrate from "meetings" to "documents" terminology:

1. **Rename the column**:
   ```sql
   -- Rename meeting_id to document_id
   ALTER TABLE ai_insights 
     RENAME COLUMN meeting_id TO document_id;

   -- Update foreign key
   ALTER TABLE ai_insights
     DROP CONSTRAINT IF EXISTS ai_insights_meeting_id_fkey,
     ADD CONSTRAINT ai_insights_document_id_fkey 
       FOREIGN KEY (document_id) 
       REFERENCES documents(id) 
       ON DELETE CASCADE;
   ```

2. **Update all related functions and triggers** to use `document_id` instead of `meeting_id`

## Testing the Fix

After applying the fix, test it with the Node.js script:

```bash
# Run the direct insight generation (without workaround)
npx tsx scripts/generate-insights-direct.ts
```

If successful, you should see insights being generated without the "meeting_title" error.

## Rollback Plan

If something goes wrong, you can restore the original state:

1. **Check trigger backups**:
   ```sql
   -- Supabase usually keeps function definitions
   SELECT prosrc 
   FROM pg_proc 
   WHERE proname LIKE '%ai_insights%';
   ```

2. **Restore from Supabase backup** (if available):
   - Go to Settings > Backups in Supabase Dashboard
   - Restore to a point before the changes

## Next Steps

After fixing the trigger:

1. **Process all documents**:
   ```bash
   # Generate insights for all 440 documents
   npx tsx scripts/generate-insights-batch.ts
   ```

2. **Monitor for errors**:
   - Check Supabase logs for any database errors
   - Monitor the application logs

3. **Update the codebase**:
   - Remove the workaround script once confirmed working
   - Update the InsightGenerator to use document_id if column was renamed