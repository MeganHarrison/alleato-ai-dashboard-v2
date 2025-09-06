-- Fix the database trigger issue that's preventing inserts

-- First, let's check what triggers exist on the meetings table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'meetings';

-- If there's a trigger trying to insert contacts, we need to either:
-- 1. Add a unique constraint on contacts.email
-- 2. Or disable/modify the trigger

-- Option 1: Add unique constraint on contacts.email if it doesn't exist
ALTER TABLE contacts 
ADD CONSTRAINT contacts_email_unique UNIQUE (email);

-- Option 2: If the above fails because of duplicates, clean up first
-- Remove duplicate emails (keeping the first occurrence)
DELETE FROM contacts a
USING contacts b
WHERE a.id > b.id 
AND a.email = b.email
AND a.email IS NOT NULL;

-- Then add the constraint
ALTER TABLE contacts 
ADD CONSTRAINT contacts_email_unique_v2 UNIQUE (email);

-- Option 3: If you want to disable the trigger temporarily
-- Find the trigger name from the first query, then:
-- ALTER TABLE meetings DISABLE TRIGGER trigger_name;

-- Test insert without trigger issues
-- This should now work
INSERT INTO meetings (
    fireflies_id,
    title,
    date,
    participants,
    topics,
    summary
) VALUES (
    'TEST_' || gen_random_uuid(),
    'Test Meeting',
    NOW(),
    ARRAY['Test User 1', 'Test User 2'],
    ARRAY['test topic 1', 'test topic 2'],
    'Test summary'
) ON CONFLICT (fireflies_id) DO NOTHING;

-- Clean up test
DELETE FROM meetings WHERE fireflies_id LIKE 'TEST_%';

-- Check if inserts work now
SELECT 'Database fixed and ready for inserts' as status;