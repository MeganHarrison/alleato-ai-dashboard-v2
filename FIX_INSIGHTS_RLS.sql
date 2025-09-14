-- =====================================================
-- FIX: ai_insights RLS Policy to Allow Anon Access
-- =====================================================
-- This SQL script fixes the Row Level Security policies on the ai_insights table
-- to allow anonymous users to read insights, which is needed for the meeting page
-- to display insights properly.
--
-- ISSUE: Meeting page at /meetings/[id] shows no insights because anon users
-- cannot read from ai_insights table due to restrictive RLS policies.
--
-- SOLUTION: Add SELECT policy for anon users while maintaining security for writes.
--
-- TO APPLY:
-- 1. Go to https://supabase.com/dashboard/project/lgveqfnpkxvzbnnwuled
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Execute it
-- 5. Test the meeting page: https://alleato-ai-dashboard.vercel.app/meetings/9c92288d-e0bf-4db4-8877-dd12fa321589

-- Step 1: Drop the existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users full access to ai_insights" ON ai_insights;

-- Step 2: Create granular policies for authenticated users
CREATE POLICY "Allow authenticated users to select ai_insights"
    ON ai_insights FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert ai_insights"
    ON ai_insights FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update ai_insights"
    ON ai_insights FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete ai_insights"
    ON ai_insights FOR DELETE
    TO authenticated
    USING (true);

-- Step 3: THE KEY FIX - Allow anon users to read insights
-- This is what enables the meeting page to display insights
CREATE POLICY "Allow anon users to view ai_insights"
    ON ai_insights FOR SELECT
    TO anon
    USING (true);

-- Step 4: Ensure proper grants are in place
GRANT SELECT ON ai_insights TO anon;
GRANT ALL ON ai_insights TO authenticated;

-- Step 5: Add documentation
COMMENT ON TABLE ai_insights IS 'AI-generated project insights. Readable by anon users for dashboard access, writable by authenticated users only. Updated 2025-09-12 to fix meeting page insights display.';

-- Verification query - this should return insights count
SELECT 
    'RLS Policy Fix Applied Successfully' as status,
    COUNT(*) as total_insights,
    COUNT(CASE WHEN document_id = '9c92288d-e0bf-4db4-8877-dd12fa321589' THEN 1 END) as test_meeting_insights
FROM ai_insights;

-- Show current policies for verification
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'ai_insights'
ORDER BY policyname;