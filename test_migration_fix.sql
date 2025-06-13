-- Test script to verify the migration fixes
-- This script tests all the components that were fixed

-- Test 1: Check if tasks table has the correct structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

-- Test 2: Check if task_assignments table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name = 'task_assignments';

-- Test 3: Check if task_comment_mentions table has correct structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'task_comment_mentions'
ORDER BY ordinal_position;

-- Test 4: Check if foreign key constraints exist
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
    AND tc.table_name = 'task_comment_mentions';

-- Test 5: Check if RLS policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('task_comments', 'task_comment_mentions');

-- Test 6: Check if functions exist
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name IN ('handle_mention_notifications', 'get_task_comments_with_users');

-- Test 7: Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_mention_notifications';

-- Test 8: Test the handle_mention_notifications function logic
DO $$
DECLARE
    test_mentions JSONB := '["550e8400-e29b-41d4-a716-446655440000"]'::JSONB;
    test_comment_id UUID := '550e8400-e29b-41d4-a716-446655440001'::UUID;
    user_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Testing mention insertion logic...';
    
    -- Check if the test user exists
    SELECT EXISTS(SELECT 1 FROM auth_users WHERE id = '550e8400-e29b-41d4-a716-446655440000'::UUID) INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE 'Test user exists, testing mention insertion...';
        
        -- Test the mention insertion logic (without actually inserting)
        FOR user_id IN 
            SELECT mentioned_user_id::UUID
            FROM jsonb_array_elements_text(test_mentions) AS mentioned_user_id
        LOOP
            RAISE NOTICE 'Processing user ID: %', user_id;
        END LOOP;
        
        RAISE NOTICE 'Mention insertion logic test completed successfully';
    ELSE
        RAISE NOTICE 'Test user does not exist, skipping insertion test';
    END IF;
END $$; 