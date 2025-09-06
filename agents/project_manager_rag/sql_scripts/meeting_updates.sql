-- SQL UPDATE STATEMENTS FOR MEETINGS
-- Generated to populate participants, action_items, and topics from raw_metadata

-- Update for: Goodwill Bloomington Morning Meeting
UPDATE meetings
SET participants = '["Jesse Dawson", "Jesse Remillard", "Jack Curtin", "Nick Jepson"]'::jsonb
WHERE id = 'c281e824-c07c-4446-beb2-e48765b981d9';

-- Update for: Ulta Fresno+ Alleato Group
UPDATE meetings
SET participants = '["Allen, Walter", "Brandon Clymer", "Jesse Dawson"]'::jsonb
WHERE id = 'bcc251b4-6dab-45f9-89ce-b8ee5d68b028';

-- Update for: GWB TB
UPDATE meetings
SET participants = '["Nick Jepson", "Jack Curtin", "Jesse Remillard", "Jesse Dawson"]'::jsonb
WHERE id = '9cc49723-afea-4ffe-b2aa-50aeedecae2d';

-- Update for: Alleato Group Taxes 2024
UPDATE meetings
SET participants = '["Fatima Njie", "Justin Atneyel", "Brandon Clymer"]'::jsonb
WHERE id = '68b9e05c-f67e-4acd-be48-8a6e9f208532';

-- Update for: GW Bloomington Meeting
UPDATE meetings
SET participants = '["Nick Jepson", "Jesse Remillard", "Jack Curtin"]'::jsonb
WHERE id = '96ee2411-789d-42b4-abd8-cc5e3a3514b3';


-- Total statements: 5
