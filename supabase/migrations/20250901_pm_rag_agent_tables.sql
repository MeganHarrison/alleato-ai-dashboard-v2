-- Create meeting_insights table
CREATE TABLE IF NOT EXISTS meeting_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  decisions JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  risks JSONB DEFAULT '[]'::jsonb,
  opportunities JSONB DEFAULT '[]'::jsonb,
  key_discussions TEXT[],
  follow_ups JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  confidence_score FLOAT DEFAULT 0.0,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_insights table
CREATE TABLE IF NOT EXISTS project_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'active',
  source_type VARCHAR(50),
  source_id UUID,
  confidence_score FLOAT DEFAULT 0.0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create action_items table
CREATE TABLE IF NOT EXISTS action_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  assignee VARCHAR(255),
  assignee_email VARCHAR(255),
  due_date DATE,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create risk_register table
CREATE TABLE IF NOT EXISTS risk_register (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  risk_title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  probability VARCHAR(20) DEFAULT 'medium',
  impact VARCHAR(20) DEFAULT 'medium',
  risk_score FLOAT,
  mitigation_strategy TEXT,
  contingency_plan TEXT,
  owner VARCHAR(255),
  status VARCHAR(20) DEFAULT 'identified',
  identified_date DATE DEFAULT CURRENT_DATE,
  review_date DATE,
  closed_date DATE,
  source_type VARCHAR(50),
  source_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create insight_categories table
CREATE TABLE IF NOT EXISTS insight_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(50),
  priority_weight INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_chunks table for enhanced RAG
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding vector(3072),
  chunk_index INT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_document_chunk UNIQUE(document_id, chunk_index)
);

-- Create meeting_project_links table
CREATE TABLE IF NOT EXISTS meeting_project_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) DEFAULT 'related',
  confidence_score FLOAT DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_meeting_project UNIQUE(meeting_id, project_id)
);

-- Create document_project_links table
CREATE TABLE IF NOT EXISTS document_project_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) DEFAULT 'related',
  confidence_score FLOAT DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_document_project UNIQUE(document_id, project_id)
);

-- Create insight_project_links table
CREATE TABLE IF NOT EXISTS insight_project_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_id UUID,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) DEFAULT 'related',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_meeting_insights_meeting_id ON meeting_insights(meeting_id);
CREATE INDEX IF NOT EXISTS idx_project_insights_project_id ON project_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_project_insights_type ON project_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_project_insights_priority ON project_insights(priority);
CREATE INDEX IF NOT EXISTS idx_action_items_project_id ON action_items(project_id);
CREATE INDEX IF NOT EXISTS idx_action_items_assignee ON action_items(assignee);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON action_items(due_date);
CREATE INDEX IF NOT EXISTS idx_risk_register_project_id ON risk_register(project_id);
CREATE INDEX IF NOT EXISTS idx_risk_register_status ON risk_register(status);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat(embedding vector_cosine_ops);

-- Add new columns to existing tables if they don't exist
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS ai_processed BOOLEAN DEFAULT false;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS insight_count INT DEFAULT 0;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS action_item_count INT DEFAULT 0;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS risk_count INT DEFAULT 0;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS health_score FLOAT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS risk_score FLOAT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS insight_count INT DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_insight_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE documents ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS chunk_count INT DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extraction_quality FLOAT;

-- Create function for hybrid search
CREATE OR REPLACE FUNCTION match_documents_hybrid(
  query_embedding vector(3072),
  query_text text,
  match_count int DEFAULT 10,
  filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float,
  text_rank float,
  combined_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_search AS (
    SELECT 
      dc.id,
      dc.document_id,
      dc.content,
      dc.metadata,
      1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    WHERE 
      CASE 
        WHEN filter->>'project_id' IS NOT NULL THEN
          dc.metadata->>'project_id' = filter->>'project_id'
        ELSE true
      END
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  text_search AS (
    SELECT 
      dc.id,
      ts_rank(to_tsvector('english', dc.content), plainto_tsquery('english', query_text)) AS text_rank
    FROM document_chunks dc
    WHERE to_tsvector('english', dc.content) @@ plainto_tsquery('english', query_text)
    LIMIT match_count * 2
  )
  SELECT 
    vs.id,
    vs.document_id,
    vs.content,
    vs.metadata,
    vs.similarity,
    COALESCE(ts.text_rank, 0) AS text_rank,
    (vs.similarity * 0.7 + COALESCE(ts.text_rank, 0) * 0.3) AS combined_score
  FROM vector_search vs
  LEFT JOIN text_search ts ON vs.id = ts.id
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- Create function to update insight counts
CREATE OR REPLACE FUNCTION update_insight_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'meeting_insights' THEN
    UPDATE meetings 
    SET 
      insight_count = (
        SELECT COUNT(*) FROM meeting_insights WHERE meeting_id = NEW.meeting_id
      ),
      action_item_count = (
        SELECT jsonb_array_length(action_items) 
        FROM meeting_insights 
        WHERE meeting_id = NEW.meeting_id
      ),
      risk_count = (
        SELECT jsonb_array_length(risks) 
        FROM meeting_insights 
        WHERE meeting_id = NEW.meeting_id
      )
    WHERE id = NEW.meeting_id;
  ELSIF TG_TABLE_NAME = 'project_insights' THEN
    UPDATE projects
    SET 
      insight_count = (
        SELECT COUNT(*) FROM project_insights WHERE project_id = NEW.project_id
      ),
      last_insight_date = NOW()
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_meeting_insight_counts
AFTER INSERT OR UPDATE OR DELETE ON meeting_insights
FOR EACH ROW EXECUTE FUNCTION update_insight_counts();

CREATE TRIGGER update_project_insight_counts
AFTER INSERT OR UPDATE OR DELETE ON project_insights
FOR EACH ROW EXECUTE FUNCTION update_insight_counts();

-- Insert default insight categories
INSERT INTO insight_categories (name, description, color, icon, priority_weight)
VALUES 
  ('decision', 'Key decisions made', '#10B981', 'CheckCircle', 5),
  ('action', 'Action items to be completed', '#F59E0B', 'Clock', 4),
  ('risk', 'Identified risks and concerns', '#EF4444', 'AlertTriangle', 5),
  ('opportunity', 'Potential opportunities', '#3B82F6', 'TrendingUp', 3),
  ('milestone', 'Project milestones', '#8B5CF6', 'Flag', 4),
  ('blocker', 'Issues blocking progress', '#DC2626', 'XCircle', 5),
  ('update', 'Status updates', '#6B7280', 'Info', 2),
  ('learning', 'Lessons learned', '#10B981', 'BookOpen', 2)
ON CONFLICT (name) DO NOTHING;

-- Grant permissions
GRANT ALL ON meeting_insights TO authenticated;
GRANT ALL ON project_insights TO authenticated;
GRANT ALL ON action_items TO authenticated;
GRANT ALL ON risk_register TO authenticated;
GRANT ALL ON insight_categories TO authenticated;
GRANT ALL ON document_chunks TO authenticated;
GRANT ALL ON meeting_project_links TO authenticated;
GRANT ALL ON document_project_links TO authenticated;
GRANT ALL ON insight_project_links TO authenticated;

-- Enable RLS
ALTER TABLE meeting_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all insights" ON meeting_insights
  FOR SELECT USING (true);

CREATE POLICY "Users can create insights" ON meeting_insights
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update insights" ON meeting_insights
  FOR UPDATE USING (true);

CREATE POLICY "Users can view all project insights" ON project_insights
  FOR SELECT USING (true);

CREATE POLICY "Users can manage project insights" ON project_insights
  FOR ALL USING (true);

CREATE POLICY "Users can view all action items" ON action_items
  FOR SELECT USING (true);

CREATE POLICY "Users can manage action items" ON action_items
  FOR ALL USING (true);

CREATE POLICY "Users can view all risks" ON risk_register
  FOR SELECT USING (true);

CREATE POLICY "Users can manage risks" ON risk_register
  FOR ALL USING (true);

CREATE POLICY "Users can view document chunks" ON document_chunks
  FOR SELECT USING (true);

CREATE POLICY "Users can manage document chunks" ON document_chunks
  FOR ALL USING (true);