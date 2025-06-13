-- Test the mention function properly
-- This script tests the function logic without trying to access NEW outside of trigger context

-- First, let's verify the function exists and is correct
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name = 'handle_mention_notifications';

-- Test the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_mention_notifications';

-- Test the jsonb_array_elements_text function with sample data
DO $$
DECLARE
    test_mentions JSONB := '["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"]'::JSONB;
    user_id_value TEXT;
BEGIN
    RAISE NOTICE 'Testing jsonb_array_elements_text function...';
    
    FOR user_id_value IN 
        SELECT jsonb_array_elements_text(test_mentions)
    LOOP
        RAISE NOTICE 'Found user ID: %', user_id_value;
    END LOOP;
    
    RAISE NOTICE 'Test completed successfully';
END $$;

-- Test inserting a comment with mentions (this will trigger the function)
-- Replace the UUIDs with actual values from your database
DO $$
DECLARE
    test_task_id UUID := '550e8400-e29b-41d4-a716-446655440000'::UUID; -- Replace with actual task ID
    test_user_id UUID := '550e8400-e29b-41d4-a716-446655440001'::UUID; -- Replace with actual user ID
    test_mentions JSONB := '["550e8400-e29b-41d4-a716-446655440002"]'::JSONB; -- Replace with actual user IDs
    comment_id UUID;
BEGIN
    RAISE NOTICE 'Testing comment insertion with mentions...';
    
    -- Insert a test comment
    INSERT INTO task_comments (task_id, user_id, message, mentions)
    VALUES (test_task_id, test_user_id, 'Test message with @mention', test_mentions)
    RETURNING id INTO comment_id;
    
    RAISE NOTICE 'Comment inserted with ID: %', comment_id;
    
    -- Check if mentions were created
    SELECT COUNT(*) INTO comment_id FROM task_comment_mentions WHERE comment_id = comment_id;
    RAISE NOTICE 'Mentions created: %', comment_id;
    
    -- Clean up test data
    DELETE FROM task_comment_mentions WHERE comment_id = comment_id;
    DELETE FROM task_comments WHERE id = comment_id;
    
    RAISE NOTICE 'Test completed and cleaned up';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed with error: %', SQLERRM;
END $$; 