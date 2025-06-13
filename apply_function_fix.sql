-- Apply the function fix to resolve ambiguous column reference
-- This script only contains the function fix, no tests

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_mention_notifications ON task_comments;

-- Create a new version of the function that eliminates the ambiguity
CREATE OR REPLACE FUNCTION handle_mention_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert mentions into the mentions table
    IF NEW.mentions IS NOT NULL AND jsonb_array_length(NEW.mentions) > 0 THEN
        -- Use a simple INSERT with explicit column selection to avoid ambiguity
        INSERT INTO task_comment_mentions (comment_id, mentioned_user_id)
        SELECT 
            NEW.id, 
            user_id_value::UUID
        FROM jsonb_array_elements_text(NEW.mentions) AS user_id_value
        WHERE EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.id = user_id_value::UUID
        )
        ON CONFLICT (comment_id, mentioned_user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_mention_notifications
    AFTER INSERT ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION handle_mention_notifications();

-- Verify the function was updated
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name = 'handle_mention_notifications'; 