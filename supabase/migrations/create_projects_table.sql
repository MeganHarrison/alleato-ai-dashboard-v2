-- Create the projects table function
CREATE OR REPLACE FUNCTION create_projects_table()
RETURNS void AS $$
BEGIN
  -- Create the projects table if it doesn't exist
  CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    client TEXT,
    status TEXT NOT NULL DEFAULT 'planning',
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
  );

  -- Create RLS policies
  ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

  -- Create policy for users to see only their own projects
  CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

  -- Create policy for users to insert their own projects
  CREATE POLICY "Users can insert their own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  -- Create policy for users to update their own projects
  CREATE POLICY "Users can update their own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id);

  -- Create policy for users to delete their own projects
  CREATE POLICY "Users can delete their own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

  -- Create updated_at trigger
  CREATE OR REPLACE FUNCTION update_modified_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Apply the trigger to the projects table
  DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
  CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

END;
$$ LANGUAGE plpgsql;
