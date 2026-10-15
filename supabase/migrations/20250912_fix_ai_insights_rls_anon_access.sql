-- Fix ai_insights RLS policy to allow anon users to read insights
-- This resolves the issue where the meeting page shows no insights
-- because anon users couldn't read the ai_insights table

-- Drop the old policy that only allowed authenticated users
DROP POLICY IF EXISTS "Allow authenticated users full access to ai_insights" ON ai_insights;

-- Create separate policies for better security control

-- Allow authenticated users full access (read/write)
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

-- Allow anon users to read insights (for public dashboard access)
CREATE POLICY "Allow anon users to view ai_insights"
    ON ai_insights FOR SELECT
    TO anon
    USING (true);

-- Add comment explaining the policy
COMMENT ON TABLE ai_insights IS 'AI-generated project insights. Readable by anon users for dashboard access, writable by authenticated users only.';

-- Grant necessary permissions
GRANT SELECT ON ai_insights TO anon;
GRANT ALL ON ai_insights TO authenticated;