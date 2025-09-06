-- Add meeting_name and project_name columns to ai_insights table for better readability
-- These will be denormalized fields for easier viewing and querying

-- Step 1: Add the new columns
ALTER TABLE ai_insights 
ADD COLUMN IF NOT EXISTS meeting_name TEXT,
ADD COLUMN IF NOT EXISTS project_name TEXT;

-- Step 2: Update existing rows with meeting names
UPDATE ai_insights ai
SET meeting_name = m.title
FROM meetings m
WHERE ai.meeting_id = m.id
AND ai.meeting_name IS NULL;

-- Step 3: Update existing rows with project names
UPDATE ai_insights ai
SET project_name = p.name
FROM projects p
WHERE ai.project_id = p.id
AND ai.project_name IS NULL;

-- Step 4: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_insights_meeting_name ON ai_insights(meeting_name);
CREATE INDEX IF NOT EXISTS idx_ai_insights_project_name ON ai_insights(project_name);

-- Step 5: Create a trigger to automatically populate these fields on insert
CREATE OR REPLACE FUNCTION populate_insight_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Get meeting name
    IF NEW.meeting_id IS NOT NULL THEN
        SELECT title INTO NEW.meeting_name
        FROM meetings
        WHERE id = NEW.meeting_id;
    END IF;
    
    -- Get project name
    IF NEW.project_id IS NOT NULL THEN
        SELECT name INTO NEW.project_name
        FROM projects
        WHERE id = NEW.project_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for new inserts
DROP TRIGGER IF EXISTS populate_insight_names_trigger ON ai_insights;
CREATE TRIGGER populate_insight_names_trigger
BEFORE INSERT ON ai_insights
FOR EACH ROW
EXECUTE FUNCTION populate_insight_names();

-- Step 7: Create a trigger for updates (in case meeting_id or project_id changes)
CREATE OR REPLACE FUNCTION update_insight_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Update meeting name if meeting_id changed
    IF NEW.meeting_id IS DISTINCT FROM OLD.meeting_id THEN
        IF NEW.meeting_id IS NOT NULL THEN
            SELECT title INTO NEW.meeting_name
            FROM meetings
            WHERE id = NEW.meeting_id;
        ELSE
            NEW.meeting_name := NULL;
        END IF;
    END IF;
    
    -- Update project name if project_id changed
    IF NEW.project_id IS DISTINCT FROM OLD.project_id THEN
        IF NEW.project_id IS NOT NULL THEN
            SELECT name INTO NEW.project_name
            FROM projects
            WHERE id = NEW.project_id;
        ELSE
            NEW.project_name := NULL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger for updates
DROP TRIGGER IF EXISTS update_insight_names_trigger ON ai_insights;
CREATE TRIGGER update_insight_names_trigger
BEFORE UPDATE ON ai_insights
FOR EACH ROW
EXECUTE FUNCTION update_insight_names();

-- Step 9: Verify the changes
SELECT 
    COUNT(*) as total_insights,
    COUNT(meeting_name) as insights_with_meeting_name,
    COUNT(project_name) as insights_with_project_name
FROM ai_insights;

-- Step 10: Sample query to see the results
SELECT 
    id,
    meeting_name,
    project_name,
    insight_type,
    title,
    severity,
    created_at
FROM ai_insights
ORDER BY created_at DESC
LIMIT 10;