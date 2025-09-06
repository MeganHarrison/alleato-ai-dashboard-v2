-- Function to get meeting statistics
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
      WHERE m.meeting_date >= NOW() - INTERVAL '7 days'
    ) as meetings_this_week,
    COUNT(DISTINCT mi.id) FILTER (
      WHERE mi.insight_type = 'action_item' 
      AND mi.status IN ('pending', 'in_progress')
    ) as pending_actions,
    COUNT(DISTINCT mi.id) FILTER (
      WHERE mi.insight_type = 'risk' 
      AND mi.status = 'pending'
    ) as open_risks,
    COUNT(DISTINCT unnest_participants.participant) as total_participants,
    AVG(m.duration_minutes)::NUMERIC(10,1) as avg_duration_minutes
  FROM meetings m
  LEFT JOIN meeting_insights mi ON mi.meeting_id = m.id
  LEFT JOIN LATERAL unnest(m.participants) as unnest_participants(participant) ON true;
END;
$$;

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
    m.meeting_date,
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

-- Function to get meeting frequency statistics
CREATE OR REPLACE FUNCTION get_meeting_frequency_stats(
  p_days_back INT DEFAULT 30
)
RETURNS TABLE (
  period_date DATE,
  meeting_count BIGINT,
  total_duration_minutes BIGINT,
  unique_participants BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(m.meeting_date) as period_date,
    COUNT(*) as meeting_count,
    SUM(m.duration_minutes)::BIGINT as total_duration_minutes,
    COUNT(DISTINCT unnest_participants.participant)::BIGINT as unique_participants
  FROM meetings m
  LEFT JOIN LATERAL unnest(m.participants) as unnest_participants(participant) ON true
  WHERE m.meeting_date >= NOW() - (p_days_back || ' days')::INTERVAL
  GROUP BY DATE(m.meeting_date)
  ORDER BY period_date DESC;
END;
$$;