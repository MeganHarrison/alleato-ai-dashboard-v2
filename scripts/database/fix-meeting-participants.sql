-- Fix Meeting Participants and Storage Paths
-- Run this in Supabase SQL Editor

-- Update GWB TB meeting
UPDATE meetings
SET 
  participants = ARRAY['Nick Jepson', 'Jack Curtin', 'Jesse Remillard', 'Jesse Dawson'],
  storage_bucket_path = 'meetings/meeting_01K3V5W3MHX24Z7FN595TM5333.md'
WHERE fireflies_id = '01K3V5W3MHX24Z7FN595TM5333';

-- Update Goodwill Bloomington Morning Meeting
UPDATE meetings
SET 
  participants = ARRAY['Jesse Dawson', 'Jesse Remillard', 'Jack Curtin', 'Nick Jepson', 'Brandon Clymer'],
  storage_bucket_path = 'meetings/meeting_01K3P855FPJDB0S5TDEFT2HBP5.md'
WHERE fireflies_id = '01K3P855FPJDB0S5TDEFT2HBP5';

-- Update Alleato Group Taxes 2024
UPDATE meetings
SET 
  participants = ARRAY['Justin Atneyel', 'Brandon Clymer', 'Fatima Njie', 'Maria Calcetero'],
  storage_bucket_path = 'meetings/meeting_01K3M58HTCCAR3G7BGZ6BFS6B4.md'
WHERE fireflies_id = '01K3M58HTCCAR3G7BGZ6BFS6B4';

-- Verify the updates
SELECT 
  title,
  participants,
  summary,
  fireflies_id,
  fireflies_link,
  storage_bucket_path,
  project_id
FROM meetings
WHERE fireflies_id IS NOT NULL
ORDER BY date DESC
LIMIT 5;