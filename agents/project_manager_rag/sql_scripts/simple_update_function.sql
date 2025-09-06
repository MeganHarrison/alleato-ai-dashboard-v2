-- Simple function to update meeting fields without triggering contacts insert
CREATE OR REPLACE FUNCTION simple_update_meeting_fields()
RETURNS TABLE(meeting_id UUID, updated boolean) AS $$
DECLARE
    rec RECORD;
    raw_data jsonb;
    participants_array text[];
    topics_array text[];
    action_items_array text[];
BEGIN
    FOR rec IN 
        SELECT id, raw_metadata 
        FROM meetings 
        WHERE raw_metadata IS NOT NULL
        AND fireflies_id IS NOT NULL
        AND (participants IS NULL OR participants = '{}')
        LIMIT 20
    LOOP
        raw_data := rec.raw_metadata;
        participants_array := NULL;
        topics_array := NULL;
        action_items_array := NULL;
        
        -- Extract participants from speakers
        IF raw_data ? 'speakers' AND jsonb_typeof(raw_data->'speakers') = 'array' THEN
            SELECT array_agg(
                CASE 
                    WHEN jsonb_typeof(speaker) = 'object' AND speaker ? 'name' THEN
                        speaker->>'name'
                    WHEN jsonb_typeof(speaker) = 'string' THEN
                        speaker #>> '{}'
                    ELSE NULL
                END
            )
            INTO participants_array
            FROM jsonb_array_elements(raw_data->'speakers') AS speaker
            WHERE speaker IS NOT NULL
            AND CASE 
                WHEN jsonb_typeof(speaker) = 'object' AND speaker ? 'name' THEN
                    speaker->>'name'
                WHEN jsonb_typeof(speaker) = 'string' THEN
                    speaker #>> '{}'
                ELSE NULL
            END IS NOT NULL;
        END IF;
        
        -- Extract topics or keywords
        IF raw_data ? 'topics' AND jsonb_typeof(raw_data->'topics') = 'array' THEN
            SELECT array_agg(topic #>> '{}')
            INTO topics_array
            FROM (
                SELECT topic
                FROM jsonb_array_elements(raw_data->'topics') AS topic
                WHERE topic IS NOT NULL
                LIMIT 10
            ) t;
        ELSIF raw_data ? 'keywords' AND jsonb_typeof(raw_data->'keywords') = 'array' THEN
            SELECT array_agg(keyword #>> '{}')
            INTO topics_array
            FROM (
                SELECT keyword
                FROM jsonb_array_elements(raw_data->'keywords') AS keyword
                WHERE keyword IS NOT NULL
                LIMIT 10
            ) k;
        END IF;
        
        -- Extract action items
        IF raw_data ? 'action_items' AND jsonb_typeof(raw_data->'action_items') = 'array' THEN
            SELECT array_agg(
                CASE 
                    WHEN jsonb_typeof(item) = 'object' THEN
                        COALESCE(item->>'text', item->>'description', item->>'item')
                    WHEN jsonb_typeof(item) = 'string' THEN
                        item #>> '{}'
                    ELSE NULL
                END
            )
            INTO action_items_array
            FROM jsonb_array_elements(raw_data->'action_items') AS item
            WHERE item IS NOT NULL
            AND CASE 
                WHEN jsonb_typeof(item) = 'object' THEN
                    COALESCE(item->>'text', item->>'description', item->>'item')
                WHEN jsonb_typeof(item) = 'string' THEN
                    item #>> '{}'
                ELSE NULL
            END IS NOT NULL;
        END IF;
        
        -- Only update if we have data to add
        IF participants_array IS NOT NULL OR topics_array IS NOT NULL OR action_items_array IS NOT NULL THEN
            -- Disable triggers temporarily for this session
            SET session_replication_role = 'replica';
            
            UPDATE meetings
            SET 
                participants = COALESCE(participants_array, participants),
                topics = COALESCE(topics_array, topics),
                action_items = COALESCE(action_items_array, action_items)
            WHERE id = rec.id;
            
            -- Re-enable triggers
            SET session_replication_role = 'origin';
            
            RETURN QUERY SELECT rec.id, true;
        ELSE
            RETURN QUERY SELECT rec.id, false;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT * FROM simple_update_meeting_fields();