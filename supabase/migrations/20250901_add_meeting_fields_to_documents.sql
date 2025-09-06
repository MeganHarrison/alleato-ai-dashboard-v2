-- Add meeting-specific fields to documents table for complete RAG functionality
-- This allows documents table to fully replace meetings table for RAG system

-- Add meeting-specific columns to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS participants TEXT[],
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS fireflies_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS fireflies_link TEXT,
ADD COLUMN IF NOT EXISTS storage_bucket_path TEXT,
ADD COLUMN IF NOT EXISTS meeting_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS action_items TEXT[],
ADD COLUMN IF NOT EXISTS topics_discussed TEXT[],
ADD COLUMN IF NOT EXISTS meeting_type TEXT,
ADD COLUMN IF NOT EXISTS sentiment_scores JSONB,
ADD COLUMN IF NOT EXISTS speaker_analytics JSONB,
ADD COLUMN IF NOT EXISTS questions_asked JSONB,
ADD COLUMN IF NOT EXISTS tasks_mentioned JSONB,
ADD COLUMN IF NOT EXISTS host_email TEXT,
ADD COLUMN IF NOT EXISTS organizer_email TEXT,
ADD COLUMN IF NOT EXISTS meeting_link TEXT,
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS transcript_url TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_fireflies_id ON documents(fireflies_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_meeting_date ON documents(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_documents_keywords ON documents USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_documents_action_items ON documents USING GIN(action_items);
CREATE INDEX IF NOT EXISTS idx_documents_participants ON documents USING GIN(participants);

-- Add computed columns for analytics
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS action_items_count INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN action_items IS NULL THEN 0
    ELSE array_length(action_items, 1)
  END
) STORED;

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS keywords_count INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN keywords IS NULL THEN 0
    ELSE array_length(keywords, 1)
  END
) STORED;

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS participants_count INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN participants IS NULL THEN 0
    ELSE array_length(participants, 1)
  END
) STORED;

-- Create a view for easy meeting document access
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

-- Grant permissions
GRANT SELECT ON meeting_documents TO authenticated;

-- Function to migrate existing meeting data to documents table
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
      -- Update existing document
      UPDATE documents SET
        participants = COALESCE(meeting_record.participants, participants),
        summary = COALESCE(meeting_record.summary, summary),
        project_id = COALESCE(meeting_record.project_id, project_id),
        fireflies_link = COALESCE(meeting_record.fireflies_link, fireflies_link),
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
      -- Create new document
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
        fireflies_link,
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

-- Comment to explain the migration
COMMENT ON FUNCTION migrate_meetings_to_documents() IS 
'Migrates all meeting data from meetings table to documents table with all fields preserved';

-- Function to search meeting documents
CREATE OR REPLACE FUNCTION search_meeting_documents(
  search_term TEXT,
  project_id_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  meeting_date TIMESTAMPTZ,
  summary TEXT,
  participants TEXT[],
  relevance_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.meeting_date,
    d.summary,
    d.participants,
    (
      CASE WHEN d.title ILIKE '%' || search_term || '%' THEN 10 ELSE 0 END +
      CASE WHEN array_to_string(d.keywords, ' ') ILIKE '%' || search_term || '%' THEN 5 ELSE 0 END +
      CASE WHEN array_to_string(d.action_items, ' ') ILIKE '%' || search_term || '%' THEN 8 ELSE 0 END +
      CASE WHEN array_to_string(d.topics_discussed, ' ') ILIKE '%' || search_term || '%' THEN 3 ELSE 0 END +
      CASE WHEN d.summary ILIKE '%' || search_term || '%' THEN 2 ELSE 0 END +
      CASE WHEN d.content ILIKE '%' || search_term || '%' THEN 1 ELSE 0 END
    ) as relevance_score
  FROM documents d
  WHERE 
    (project_id_filter IS NULL OR d.project_id = project_id_filter)
    AND (d.category = 'meeting' OR d.fireflies_id IS NOT NULL)
    AND (
      d.title ILIKE '%' || search_term || '%'
      OR array_to_string(d.keywords, ' ') ILIKE '%' || search_term || '%'
      OR array_to_string(d.action_items, ' ') ILIKE '%' || search_term || '%'
      OR array_to_string(d.topics_discussed, ' ') ILIKE '%' || search_term || '%'
      OR d.summary ILIKE '%' || search_term || '%'
      OR d.content ILIKE '%' || search_term || '%'
    )
  ORDER BY relevance_score DESC, d.meeting_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_meeting_documents(TEXT, UUID) TO authenticated;