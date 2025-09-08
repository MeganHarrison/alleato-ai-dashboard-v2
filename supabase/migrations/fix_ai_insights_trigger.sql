-- Fix AI Insights Trigger Issue
-- This migration removes the problematic trigger that references non-existent 'meeting_title' field

-- Step 1: Drop the existing problematic trigger (if it exists)
DROP TRIGGER IF EXISTS ai_insights_trigger ON ai_insights;
DROP FUNCTION IF EXISTS process_ai_insights() CASCADE;

-- Step 2: Create a new, corrected trigger function without meeting_title reference
CREATE OR REPLACE FUNCTION process_ai_insights()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate required fields
  IF NEW.meeting_id IS NULL THEN
    RAISE EXCEPTION 'meeting_id cannot be null';
  END IF;
  
  IF NEW.insight_type IS NULL THEN
    RAISE EXCEPTION 'insight_type cannot be null';
  END IF;
  
  -- Set default values if not provided
  IF NEW.created_at IS NULL THEN
    NEW.created_at = NOW();
  END IF;
  
  IF NEW.resolved IS NULL THEN
    NEW.resolved = 0;
  END IF;
  
  IF NEW.confidence_score IS NULL THEN
    NEW.confidence_score = 0.5;
  END IF;
  
  -- Return the modified record
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the new trigger
CREATE TRIGGER ai_insights_before_insert
  BEFORE INSERT ON ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION process_ai_insights();

-- Step 4: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_insights_meeting_id ON ai_insights(meeting_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_project_id ON ai_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_insight_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights(created_at DESC);

-- Step 5: Optional - Rename meeting_id to document_id for consistency
-- Uncomment these lines if you want to fully migrate to document-based naming
/*
ALTER TABLE ai_insights 
  RENAME COLUMN meeting_id TO document_id;

-- Update foreign key constraint if it exists
ALTER TABLE ai_insights
  DROP CONSTRAINT IF EXISTS ai_insights_meeting_id_fkey,
  ADD CONSTRAINT ai_insights_document_id_fkey 
    FOREIGN KEY (document_id) 
    REFERENCES documents(id) 
    ON DELETE CASCADE;
*/

-- Step 6: Grant proper permissions
GRANT ALL ON ai_insights TO authenticated;
GRANT ALL ON ai_insights TO service_role;

-- Step 7: Add RLS policies if needed
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all insights
CREATE POLICY "Allow authenticated users to read insights" ON ai_insights
  FOR SELECT TO authenticated
  USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access" ON ai_insights
  FOR ALL TO service_role
  USING (true);