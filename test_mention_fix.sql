-- Test script to verify the mention functionality works correctly
-- This script tests the task_comment_mentions table and related functions

-- Test 1: Check if the foreign key constraint exists
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'task_comment_mentions'
    AND kcu.column_name = 'mentioned_user_id';

-- Test 2: Check the structure of task_comment_mentions table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'task_comment_mentions'
ORDER BY ordinal_position;

-- Test 3: Check if the handle_mention_notifications function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name = 'handle_mention_notifications';

-- Test 4: Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_mention_notifications';

-- Test 5: Test the function with sample data (if you have test data)
-- This will help verify that the ambiguous column reference is fixed
DO $$
DECLARE
    test_mentions JSONB := '["550e8400-e29b-41d4-a716-446655440000"]'::JSONB;
    test_comment_id UUID := '550e8400-e29b-41d4-a716-446655440001'::UUID;
    user_exists BOOLEAN;
BEGIN
    -- Check if the test user exists
    SELECT EXISTS(SELECT 1 FROM auth_users WHERE id = '550e8400-e29b-41d4-a716-446655440000'::UUID) INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE 'Test user exists, testing mention insertion...';
        
        -- Test the mention insertion logic
        INSERT INTO task_comment_mentions (comment_id, mentioned_user_id)
        SELECT test_comment_id, mentioned_user_id::UUID
        FROM jsonb_array_elements_text(test_mentions) AS mentioned_user_id
        ON CONFLICT (comment_id, mentioned_user_id) DO NOTHING;
        
        RAISE NOTICE 'Mention insertion test completed successfully';
    ELSE
        RAISE NOTICE 'Test user does not exist, skipping insertion test';
    END IF;
END $$; 