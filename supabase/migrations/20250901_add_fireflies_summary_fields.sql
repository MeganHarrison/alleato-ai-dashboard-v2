-- Add Fireflies summary fields to meetings table
-- This migration adds comprehensive meeting intelligence fields from Fireflies API

-- Add new columns for Fireflies summary data
ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS action_items TEXT[],
ADD COLUMN IF NOT EXISTS topics_discussed TEXT[],
ADD COLUMN IF NOT EXISTS meeting_type TEXT,
ADD COLUMN IF NOT EXISTS sentiment_scores JSONB,
ADD COLUMN IF NOT EXISTS speaker_analytics JSONB,
ADD COLUMN IF NOT EXISTS meeting_outline TEXT,
ADD COLUMN IF NOT EXISTS transcript_chapters JSONB,
ADD COLUMN IF NOT EXISTS questions_asked JSONB,
ADD COLUMN IF NOT EXISTS tasks_mentioned JSONB,
ADD COLUMN IF NOT EXISTS metrics_discussed JSONB,
ADD COLUMN IF NOT EXISTS dates_mentioned JSONB,
ADD COLUMN IF NOT EXISTS host_email TEXT,
ADD COLUMN IF NOT EXISTS organizer_email TEXT,
ADD COLUMN IF NOT EXISTS meeting_link TEXT,
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS transcript_url TEXT;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_meetings_keywords ON meetings USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_meetings_action_items ON meetings USING GIN(action_items);
CREATE INDEX IF NOT EXISTS idx_meetings_topics ON meetings USING GIN(topics_discussed);
CREATE INDEX IF NOT EXISTS idx_meetings_meeting_type ON meetings(meeting_type);
CREATE INDEX IF NOT EXISTS idx_meetings_host_email ON meetings(host_email);

-- Add a computed column for total action items count
ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS action_items_count INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN action_items IS NULL THEN 0
    ELSE array_length(action_items, 1)
  END
) STORED;

-- Add a computed column for total keywords count
ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS keywords_count INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN keywords IS NULL THEN 0
    ELSE array_length(keywords, 1)
  END
) STORED;

-- Create a view for easy meeting summary access
CREATE OR REPLACE VIEW meeting_summaries AS
SELECT 
  m.id,
  m.fireflies_id,
  m.title,
  m.meeting_date,
  m.duration_minutes,
  m.participants,
  m.project_id,
  p.name as project_name,
  m.summary,
  m.keywords,
  m.action_items,
  m.topics_discussed,
  m.meeting_type,
  m.sentiment_scores,
  m.speaker_analytics,
  m.action_items_count,
  m.keywords_count,
  m.host_email,
  m.meeting_link,
  m.transcript_url,
  CASE 
    WHEN m.sentiment_scores->>'positive_pct' IS NOT NULL 
    THEN (m.sentiment_scores->>'positive_pct')::FLOAT
    ELSE NULL
  END as positive_sentiment_pct,
  CASE 
    WHEN m.sentiment_scores->>'negative_pct' IS NOT NULL 
    THEN (m.sentiment_scores->>'negative_pct')::FLOAT
    ELSE NULL
  END as negative_sentiment_pct
FROM meetings m
LEFT JOIN projects p ON m.project_id = p.id
ORDER BY m.meeting_date DESC;

-- Grant access to the view
GRANT SELECT ON meeting_summaries TO authenticated;

-- Function to get meeting summary with all details
CREATE OR REPLACE FUNCTION get_meeting_summary(meeting_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', m.id,
    'fireflies_id', m.fireflies_id,
    'title', m.title,
    'date', m.meeting_date,
    'duration_minutes', m.duration_minutes,
    'participants', m.participants,
    'project', jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'job_number', p."job number"
    ),
    'summary', m.summary,
    'keywords', m.keywords,
    'action_items', m.action_items,
    'topics_discussed', m.topics_discussed,
    'meeting_type', m.meeting_type,
    'sentiment', m.sentiment_scores,
    'speakers', m.speaker_analytics,
    'questions', m.questions_asked,
    'tasks', m.tasks_mentioned,
    'metrics', m.metrics_discussed,
    'dates', m.dates_mentioned,
    'links', jsonb_build_object(
      'meeting', m.meeting_link,
      'transcript', m.transcript_url,
      'audio', m.audio_url,
      'video', m.video_url
    ),
    'metadata', m.metadata
  ) INTO result
  FROM meetings m
  LEFT JOIN projects p ON m.project_id = p.id
  WHERE m.id = meeting_id_param;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search meetings by keywords or action items
CREATE OR REPLACE FUNCTION search_meetings_by_content(
  search_term TEXT,
  project_id_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  meeting_date TIMESTAMPTZ,
  relevance_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.title,
    m.meeting_date,
    (
      CASE WHEN m.title ILIKE '%' || search_term || '%' THEN 10 ELSE 0 END +
      CASE WHEN array_to_string(m.keywords, ' ') ILIKE '%' || search_term || '%' THEN 5 ELSE 0 END +
      CASE WHEN array_to_string(m.action_items, ' ') ILIKE '%' || search_term || '%' THEN 8 ELSE 0 END +
      CASE WHEN array_to_string(m.topics_discussed, ' ') ILIKE '%' || search_term || '%' THEN 3 ELSE 0 END +
      CASE WHEN m.summary ILIKE '%' || search_term || '%' THEN 2 ELSE 0 END
    ) as relevance_score
  FROM meetings m
  WHERE 
    (project_id_filter IS NULL OR m.project_id = project_id_filter)
    AND (
      m.title ILIKE '%' || search_term || '%'
      OR array_to_string(m.keywords, ' ') ILIKE '%' || search_term || '%'
      OR array_to_string(m.action_items, ' ') ILIKE '%' || search_term || '%'
      OR array_to_string(m.topics_discussed, ' ') ILIKE '%' || search_term || '%'
      OR m.summary ILIKE '%' || search_term || '%'
    )
  ORDER BY relevance_score DESC, m.meeting_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_meeting_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_meetings_by_content(TEXT, UUID) TO authenticated;