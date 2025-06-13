-- Check all triggers and functions that might be causing the ambiguous column reference error

-- Check all triggers on task_comments table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_condition
FROM information_schema.triggers
WHERE event_object_table = 'task_comments'
ORDER BY trigger_name;

-- Check all triggers on task_comment_mentions table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_condition
FROM information_schema.triggers
WHERE event_object_table = 'task_comment_mentions'
ORDER BY trigger_name;

-- Check all functions that might be related to mentions
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name LIKE '%mention%' OR routine_name LIKE '%comment%'
ORDER BY routine_name;

-- Check if there are any other functions that might be called
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_definition LIKE '%mentioned_user_id%'
ORDER BY routine_name;

-- Check the current function definition
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_mention_notifications'; 