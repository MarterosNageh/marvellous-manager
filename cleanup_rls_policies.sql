-- Clean up all RLS policies and disable RLS for task chat tables
-- This will resolve the policy conflicts and allow insertions

-- First, disable RLS on both tables
ALTER TABLE task_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_comment_mentions DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on task_comments
DROP POLICY IF EXISTS "Users can view all task comments" ON task_comments;
DROP POLICY IF EXISTS "Users can view comments for tasks they have access to" ON task_comments;
DROP POLICY IF EXISTS "Users can insert comments for tasks they have access to" ON task_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON task_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON task_comments;
DROP POLICY IF EXISTS "Users can create task comments" ON task_comments;
DROP POLICY IF EXISTS "Users can update their own task comments" ON task_comments;
DROP POLICY IF EXISTS "Users can delete their own task comments" ON task_comments;

-- Drop all existing policies on task_comment_mentions
DROP POLICY IF EXISTS "Users can view mentions for comments they can see" ON task_comment_mentions;
DROP POLICY IF EXISTS "Users can view mentions for tasks they're involved in" ON task_comment_mentions;
DROP POLICY IF EXISTS "Users can insert mentions for their comments" ON task_comment_mentions;
DROP POLICY IF EXISTS "Users can create mentions when creating comments" ON task_comment_mentions;
DROP POLICY IF EXISTS "Users can update their own mention status" ON task_comment_mentions;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('task_comments', 'task_comment_mentions');

-- Verify no policies remain
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('task_comments', 'task_comment_mentions')
ORDER BY tablename, policyname;

-- Test that we can insert into task_comments (this should work now)
-- Note: This is just a test query, you don't need to run it
-- INSERT INTO task_comments (task_id, user_id, message) VALUES ('test-task-id', 'test-user-id', 'Test message'); 