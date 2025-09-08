-- Migration to prevent duplicate insights in the ai_insights table
-- This adds a content hash field and unique constraint to prevent duplicates

-- Step 1: Add a column to store the insight hash
ALTER TABLE ai_insights 
ADD COLUMN IF NOT EXISTS content_hash VARCHAR(32);

-- Step 2: Create a function to generate the hash
-- The hash is based on meeting_id/document_id, insight_type, and normalized title
CREATE OR REPLACE FUNCTION generate_insight_hash()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate hash based on key fields that identify unique insights
  -- Using meeting_id, insight_type, and normalized title
  NEW.content_hash = MD5(
    CONCAT(
      COALESCE(NEW.meeting_id::text, ''),
      '_',
      NEW.insight_type,
      '_',
      LOWER(TRIM(NEW.title))
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create a trigger to automatically set the hash before insert or update
DROP TRIGGER IF EXISTS set_insight_hash ON ai_insights;
CREATE TRIGGER set_insight_hash
  BEFORE INSERT OR UPDATE ON ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION generate_insight_hash();

-- Step 4: Update existing records with hashes
-- This ensures all existing insights have a content_hash
UPDATE ai_insights
SET content_hash = MD5(
  CONCAT(
    COALESCE(meeting_id::text, ''),
    '_',
    insight_type,
    '_',
    LOWER(TRIM(title))
  )
)
WHERE content_hash IS NULL;

-- Step 5: Create unique index to prevent duplicates
-- This will prevent inserting insights with the same meeting_id, insight_type, and title
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_insights_unique_content
ON ai_insights(content_hash);

-- Step 6: Add comment to explain the purpose
COMMENT ON COLUMN ai_insights.content_hash IS 'MD5 hash of meeting_id + insight_type + normalized title to prevent duplicates';

-- Step 7: Create a helper function to check for duplicates before insert (optional)
CREATE OR REPLACE FUNCTION check_insight_duplicate(
  p_meeting_id UUID,
  p_insight_type TEXT,
  p_title TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_hash VARCHAR(32);
  v_exists BOOLEAN;
BEGIN
  -- Generate the same hash that would be created by the trigger
  v_hash := MD5(
    CONCAT(
      COALESCE(p_meeting_id::text, ''),
      '_',
      p_insight_type,
      '_',
      LOWER(TRIM(p_title))
    )
  );
  
  -- Check if this hash already exists
  SELECT EXISTS(
    SELECT 1 FROM ai_insights WHERE content_hash = v_hash
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$;

COMMENT ON FUNCTION check_insight_duplicate IS 'Check if an insight with the same meeting_id, type, and title already exists';

-- Step 8: Create a view to show duplicate attempts (for monitoring)
CREATE OR REPLACE VIEW duplicate_insight_attempts AS
SELECT 
  content_hash,
  COUNT(*) as duplicate_count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_attempted,
  insight_type,
  title,
  meeting_id
FROM ai_insights
GROUP BY content_hash, insight_type, title, meeting_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

COMMENT ON VIEW duplicate_insight_attempts IS 'View showing insights that have had duplicate attempts';

-- Step 9: Grant permissions on new objects
GRANT SELECT ON duplicate_insight_attempts TO authenticated;
GRANT EXECUTE ON FUNCTION check_insight_duplicate TO authenticated;