-- Remove ALL triggers that handle mentions to eliminate the ambiguous column reference error
-- This will remove both the old and new mention triggers

-- Drop the new trigger
DROP TRIGGER IF EXISTS trigger_mention_notifications ON task_comments;

-- Drop the old trigger
DROP TRIGGER IF EXISTS create_mentions_on_comment ON task_comments;

-- Drop the functions
DROP FUNCTION IF EXISTS handle_mention_notifications();
DROP FUNCTION IF EXISTS create_comment_mentions();

-- Verify all mention-related triggers are removed
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'task_comments'
ORDER BY trigger_name;

-- Verify all mention-related functions are removed
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name IN ('handle_mention_notifications', 'create_comment_mentions')
ORDER BY routine_name;

-- Show remaining triggers (should only show update_task_comments_updated_at)
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'task_comments'
ORDER BY trigger_name; 