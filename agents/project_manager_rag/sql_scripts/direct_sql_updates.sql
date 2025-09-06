-- Direct SQL updates for specific meetings
-- These bypass any triggers by updating fields directly

-- Meeting 1: Goodwill Bloomington Morning Meeting
UPDATE meetings
SET 
    participants = ARRAY['Jesse Dawson', 'Jesse Remillard', 'Jack Curtin', 'Nick Jepson'],
    topics = ARRAY['project delays', 'weather issues', 'flight delays', 'project scheduling', 'team coordination', 'travel disruptions']
WHERE id = 'c281e824-c07c-4446-beb2-e48765b981d9';

-- Meeting 2: Ulta Fresno+ Alleato Group  
UPDATE meetings
SET 
    participants = ARRAY['Allen, Walter', 'Brandon Clymer', 'Jesse Dawson'],
    topics = ARRAY['HVAC upgrade', 'California regulations', 'workplace temperature', 'air conditioning', 'compliance', 'Ulta Fresno']
WHERE id = 'bcc251b4-6dab-45f9-89ce-b8ee5d68b028';

-- Meeting 3: GWB TB
UPDATE meetings
SET 
    participants = ARRAY['Nick Jepson', 'Jack Curtin', 'Jesse Remillard', 'Jesse Dawson'],
    topics = ARRAY['material removal', 'studs', 'scrap metal', 'Tuesday schedule', 'Glenmark', 'construction']
WHERE id = '9cc49723-afea-4ffe-b2aa-50aeedecae2d';

-- Meeting 4: Alleato Group Taxes 2024
UPDATE meetings
SET 
    participants = ARRAY['Fatima Njie', 'Justin Atneyel', 'Brandon Clymer'],
    topics = ARRAY['tax preparation', 'CPA selection', 'MGO', 'personal returns', 'business returns', 'tax proposal']
WHERE id = '68b9e05c-f67e-4acd-be48-8a6e9f208532';

-- Meeting 5: GW Bloomington Meeting
UPDATE meetings
SET 
    participants = ARRAY['Nick Jepson', 'Jesse Remillard', 'Jack Curtin'],
    topics = ARRAY['overhead door', 'installation', 'concrete mobilization', 'United', 'project timeline', 'construction schedule']
WHERE id = '96ee2411-789d-42b4-abd8-cc5e3a3514b3';

-- Verify the updates
SELECT id, title, 
       array_length(participants, 1) as participant_count,
       array_length(topics, 1) as topic_count,
       array_length(action_items, 1) as action_item_count
FROM meetings
WHERE fireflies_id IS NOT NULL
ORDER BY date DESC
LIMIT 10;