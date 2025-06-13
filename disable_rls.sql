-- Disable RLS for task chat tables
-- This will allow insertions without policy restrictions

-- Disable RLS on task_comments table
ALTER TABLE task_comments DISABLE ROW LEVEL SECURITY;

-- Disable RLS on task_comment_mentions table
ALTER TABLE task_comment_mentions DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('task_comments', 'task_comment_mentions');

-- Show current policies (they will be ignored when RLS is disabled)
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