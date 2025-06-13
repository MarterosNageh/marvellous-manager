-- Disable the problematic trigger that's causing the ambiguous column reference error
-- This will allow the frontend to handle mentions manually

-- Disable the trigger
ALTER TABLE task_comments DISABLE TRIGGER trigger_mention_notifications;

-- Verify the trigger is disabled
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_condition
FROM information_schema.triggers
WHERE trigger_name = 'trigger_mention_notifications';

-- Alternative: Drop the trigger completely if needed
-- DROP TRIGGER IF EXISTS trigger_mention_notifications ON task_comments;

-- Test that we can insert without the trigger
-- This should work now without the ambiguous column reference error 