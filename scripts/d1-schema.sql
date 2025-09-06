-- Cloudflare D1 Database Schema for Meetings table
-- Database ID: fc7c9a6d-ca65-4768-b3f9-07ec5afb38c5

-- Drop table if exists (optional, for clean setup)
DROP TABLE IF EXISTS meetings;

-- Create the meetings table
CREATE TABLE meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  participants TEXT, -- JSON array stored as text
  summary TEXT,
  action_items TEXT, -- JSON array stored as text
  project_id TEXT,
  project_name TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for better performance
CREATE INDEX idx_meetings_date ON meetings(date DESC);
CREATE INDEX idx_meetings_project_id ON meetings(project_id);

-- Sample data (optional)
INSERT INTO meetings (title, date, participants, summary, action_items, project_id, project_name)
VALUES 
  (
    'Weekly Team Sync',
    '2025-08-28',
    '["John Doe", "Jane Smith", "Bob Johnson"]',
    'Discussed Q3 objectives and upcoming deliverables',
    '["Review budget allocation", "Prepare Q3 presentation", "Schedule client meetings"]',
    'proj-001',
    'Q3 Planning'
  ),
  (
    'Client Onboarding Meeting',
    '2025-08-27',
    '["Jane Smith", "Client Rep"]',
    'Initial onboarding session with new client',
    '["Send welcome package", "Setup project workspace", "Schedule follow-up"]',
    'proj-002',
    'Client Onboarding'
  ),
  (
    'Product Review',
    '2025-08-26',
    '["Team Lead", "Product Manager", "Dev Team"]',
    'Reviewed product roadmap and feature priorities',
    '["Update roadmap document", "Create feature specs", "Assign development tasks"]',
    'proj-003',
    'Product Development'
  );

-- To run this in Cloudflare D1:
-- 1. Install Wrangler CLI: npm install -g wrangler
-- 2. Login to Cloudflare: wrangler login
-- 3. Execute the schema: wrangler d1 execute meetings --file=./scripts/d1-schema.sql --remote