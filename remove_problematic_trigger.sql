-- Completely remove the problematic trigger and function
-- This will eliminate the ambiguous column reference error

-- Drop the trigger
DROP TRIGGER IF EXISTS trigger_mention_notifications ON task_comments;

-- Drop the function
DROP FUNCTION IF EXISTS handle_mention_notifications();

-- Verify they are removed
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_mention_notifications';

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name = 'handle_mention_notifications';

-- Check if there are any other triggers on task_comments
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'task_comments'
ORDER BY trigger_name; 