-- Create meeting_insights table for AI-generated insights
CREATE TABLE IF NOT EXISTS meeting_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('risk', 'action_item', 'decision', 'question', 'highlight', 'blocker', 'update')),
  content TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'dismissed')),
  assigned_to TEXT,
  due_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_meeting_insights_meeting_id ON meeting_insights(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_insights_type ON meeting_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_meeting_insights_status ON meeting_insights(status);
CREATE INDEX IF NOT EXISTS idx_meeting_insights_priority ON meeting_insights(priority);

-- Enable RLS
ALTER TABLE meeting_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all meeting insights" ON meeting_insights
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can manage meeting insights" ON meeting_insights
  FOR ALL TO authenticated
  USING (true);

-- Function to get recent meeting insights for a project
CREATE OR REPLACE FUNCTION get_recent_project_insights(
  p_project_id UUID,
  p_days_back INT DEFAULT 30,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  insight_id UUID,
  insight_type TEXT,
  content TEXT,
  priority TEXT,
  status TEXT,
  assigned_to TEXT,
  due_date DATE,
  meeting_id UUID,
  meeting_title TEXT,
  meeting_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mi.id as insight_id,
    mi.insight_type,
    mi.content,
    mi.priority,
    mi.status,
    mi.assigned_to,
    mi.due_date,
    m.id as meeting_id,
    m.title as meeting_title,
    m.date as meeting_date,
    mi.created_at
  FROM meeting_insights mi
  JOIN meetings m ON m.id = mi.meeting_id
  WHERE m.project_id = p_project_id
    AND mi.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
  ORDER BY 
    CASE mi.priority 
      WHEN 'high' THEN 1 
      WHEN 'medium' THEN 2 
      WHEN 'low' THEN 3 
      ELSE 4 
    END,
    mi.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Function to get meeting statistics with insights
CREATE OR REPLACE FUNCTION get_meeting_statistics()
RETURNS TABLE (
  total_meetings BIGINT,
  meetings_this_week BIGINT,
  pending_actions BIGINT,
  open_risks BIGINT,
  total_participants BIGINT,
  avg_duration_minutes NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT m.id) as total_meetings,
    COUNT(DISTINCT m.id) FILTER (
      WHERE m.date >= NOW() - INTERVAL '7 days'
    ) as meetings_this_week,
    COUNT(DISTINCT mi.id) FILTER (
      WHERE mi.insight_type = 'action_item' 
      AND mi.status IN ('pending', 'in_progress')
    ) as pending_actions,
    COUNT(DISTINCT mi.id) FILTER (
      WHERE mi.insight_type = 'risk' 
      AND mi.status = 'pending'
    ) as open_risks,
    COALESCE(
      (SELECT COUNT(DISTINCT unnest(participants))::BIGINT 
       FROM meetings 
       WHERE participants IS NOT NULL),
      0
    ) as total_participants,
    AVG(m.duration_minutes)::NUMERIC(10,1) as avg_duration_minutes
  FROM meetings m
  LEFT JOIN meeting_insights mi ON mi.meeting_id = m.id;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meeting_insights_updated_at 
  BEFORE UPDATE ON meeting_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();