-- Rename fireflies_link column to fireflies_url in documents table
-- This aligns with the naming convention used for other URL fields

-- Rename the column
ALTER TABLE documents 
RENAME COLUMN fireflies_link TO fireflies_url;

-- Update the view to use the new column name
CREATE OR REPLACE VIEW meeting_documents AS
SELECT 
  d.*,
  p.name as project_name,
  p."job number" as project_job_number,
  CASE 
    WHEN d.sentiment_scores->>'positive_pct' IS NOT NULL 
    THEN (d.sentiment_scores->>'positive_pct')::FLOAT
    ELSE NULL
  END as positive_sentiment_pct,
  CASE 
    WHEN d.sentiment_scores->>'negative_pct' IS NOT NULL 
    THEN (d.sentiment_scores->>'negative_pct')::FLOAT
    ELSE NULL
  END as negative_sentiment_pct,
  CASE 
    WHEN d.sentiment_scores->>'neutral_pct' IS NOT NULL 
    THEN (d.sentiment_scores->>'neutral_pct')::FLOAT
    ELSE NULL
  END as neutral_sentiment_pct
FROM documents d
LEFT JOIN projects p ON d.project_id = p.id
WHERE d.category = 'meeting' OR d.source LIKE '%meeting%' OR d.fireflies_id IS NOT NULL
ORDER BY d.meeting_date DESC NULLS LAST, d.created_at DESC;

-- Update the migration function to use the new column name
CREATE OR REPLACE FUNCTION migrate_meetings_to_documents()
RETURNS void AS $$
DECLARE
  meeting_record RECORD;
  doc_exists BOOLEAN;
BEGIN
  -- Loop through all meetings with Fireflies data
  FOR meeting_record IN 
    SELECT * FROM meetings 
    WHERE fireflies_id IS NOT NULL
  LOOP
    -- Check if document already exists
    SELECT EXISTS(
      SELECT 1 FROM documents 
      WHERE fireflies_id = meeting_record.fireflies_id
    ) INTO doc_exists;
    
    IF doc_exists THEN
      -- Update existing document (now using fireflies_url)
      UPDATE documents SET
        participants = COALESCE(meeting_record.participants, participants),
        summary = COALESCE(meeting_record.summary, summary),
        project_id = COALESCE(meeting_record.project_id, project_id),
        fireflies_url = COALESCE(meeting_record.fireflies_link, fireflies_url),
        storage_bucket_path = COALESCE(meeting_record.storage_bucket_path, storage_bucket_path),
        meeting_date = COALESCE(meeting_record.date, meeting_date),
        duration_minutes = COALESCE(meeting_record.duration_minutes, duration_minutes),
        keywords = COALESCE(
          CASE 
            WHEN meeting_record.raw_metadata->>'keywords' IS NOT NULL 
            THEN ARRAY(SELECT jsonb_array_elements_text(meeting_record.raw_metadata->'keywords'))
            ELSE NULL
          END, 
          keywords
        ),
        action_items = COALESCE(
          CASE 
            WHEN meeting_record.raw_metadata->>'action_items' IS NOT NULL 
            THEN ARRAY(SELECT jsonb_array_elements_text(meeting_record.raw_metadata->'action_items'))
            ELSE NULL
          END,
          action_items
        ),
        sentiment_scores = COALESCE(meeting_record.raw_metadata->'sentiment_details', sentiment_scores),
        speaker_analytics = COALESCE(meeting_record.raw_metadata->'speakers', speaker_analytics)
      WHERE fireflies_id = meeting_record.fireflies_id;
    ELSE
      -- Create new document (now using fireflies_url)
      INSERT INTO documents (
        title,
        source,
        category,
        file_path,
        file_type,
        content,
        status,
        participants,
        summary,
        project_id,
        fireflies_id,
        fireflies_url,
        storage_bucket_path,
        meeting_date,
        duration_minutes,
        keywords,
        action_items,
        sentiment_scores,
        speaker_analytics,
        metadata
      ) VALUES (
        meeting_record.title,
        'fireflies_meeting',
        'meeting',
        COALESCE(meeting_record.storage_bucket_path, 'meetings/' || meeting_record.fireflies_id || '.md'),
        'md',
        COALESCE(meeting_record.raw_metadata->>'transcript_content', meeting_record.summary, ''),
        'completed',
        meeting_record.participants,
        meeting_record.summary,
        meeting_record.project_id,
        meeting_record.fireflies_id,
        meeting_record.fireflies_link,
        meeting_record.storage_bucket_path,
        meeting_record.date,
        meeting_record.duration_minutes,
        CASE 
          WHEN meeting_record.raw_metadata->>'keywords' IS NOT NULL 
          THEN ARRAY(SELECT jsonb_array_elements_text(meeting_record.raw_metadata->'keywords'))
          ELSE NULL
        END,
        CASE 
          WHEN meeting_record.raw_metadata->>'action_items' IS NOT NULL 
          THEN ARRAY(SELECT jsonb_array_elements_text(meeting_record.raw_metadata->'action_items'))
          ELSE NULL
        END,
        meeting_record.raw_metadata->'sentiment_details',
        meeting_record.raw_metadata->'speakers',
        jsonb_build_object(
          'meeting_id', meeting_record.id,
          'original_meeting_data', true,
          'migrated_at', NOW()
        ) || COALESCE(meeting_record.raw_metadata, '{}'::jsonb)
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comment about the rename
COMMENT ON COLUMN documents.fireflies_url IS 'URL to the Fireflies transcript (renamed from fireflies_link for consistency)';