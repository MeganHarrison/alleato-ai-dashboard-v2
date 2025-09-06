-- Create a function to update meeting fields from raw_metadata
CREATE OR REPLACE FUNCTION update_meeting_from_metadata(meeting_id UUID)
RETURNS void AS $$
DECLARE
    raw_data jsonb;
    speakers_data jsonb;
    participants_array text[];
    action_items_array text[];
    topics_array text[];
BEGIN
    -- Get the raw_metadata for this meeting
    SELECT raw_metadata INTO raw_data
    FROM meetings
    WHERE id = meeting_id;
    
    -- Extract participants from speakers
    IF raw_data ? 'speakers' THEN
        speakers_data := raw_data->'speakers';
        IF jsonb_typeof(speakers_data) = 'array' THEN
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
            FROM jsonb_array_elements(speakers_data) AS speaker
            WHERE speaker IS NOT NULL;
        END IF;
    END IF;
    
    -- Extract action items (check if it's an array first)
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
        WHERE item IS NOT NULL;
    END IF;
    
    -- Extract topics or keywords (check if arrays first)
    IF raw_data ? 'topics' AND jsonb_typeof(raw_data->'topics') = 'array' THEN
        SELECT array_agg(topic #>> '{}')
        INTO topics_array
        FROM (
            SELECT topic
            FROM jsonb_array_elements(raw_data->'topics') AS topic
            LIMIT 10
        ) t;
    ELSIF raw_data ? 'keywords' AND jsonb_typeof(raw_data->'keywords') = 'array' THEN
        SELECT array_agg(keyword #>> '{}')
        INTO topics_array
        FROM (
            SELECT keyword
            FROM jsonb_array_elements(raw_data->'keywords') AS keyword
            LIMIT 10
        ) k;
    END IF;
    
    -- Update the meeting with extracted data
    UPDATE meetings
    SET 
        participants = COALESCE(participants_array, participants),
        action_items = COALESCE(action_items_array, action_items),
        topics = COALESCE(topics_array, topics),
        updated_at = NOW()
    WHERE id = meeting_id
    AND (
        participants IS NULL OR participants = '{}' OR
        action_items IS NULL OR action_items = '{}' OR
        topics IS NULL OR topics = '{}'
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to update all meetings
CREATE OR REPLACE FUNCTION update_all_meetings_from_metadata()
RETURNS TABLE(updated_count integer) AS $$
DECLARE
    rec RECORD;
    count integer := 0;
BEGIN
    FOR rec IN 
        SELECT id 
        FROM meetings 
        WHERE raw_metadata IS NOT NULL
        AND fireflies_id IS NOT NULL
        AND (
            participants IS NULL OR participants = '{}' OR
            action_items IS NULL OR action_items = '{}' OR
            topics IS NULL OR topics = '{}'
        )
        LIMIT 100
    LOOP
        PERFORM update_meeting_from_metadata(rec.id);
        count := count + 1;
    END LOOP;
    
    RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql;

-- Execute the update for all meetings
SELECT update_all_meetings_from_metadata();