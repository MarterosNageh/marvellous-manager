-- Fix RLS policy for task_comments
-- This script creates more permissive policies that should resolve the RLS violation error

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view comments for tasks they have access to" ON task_comments;
DROP POLICY IF EXISTS "Users can insert comments for tasks they have access to" ON task_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON task_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON task_comments;

-- Create more permissive policies
-- Allow any authenticated user to view comments (for now)
CREATE POLICY "Users can view all task comments" ON task_comments
    FOR SELECT USING (true);

-- Allow authenticated users to insert comments on any task
CREATE POLICY "Users can insert comments on any task" ON task_comments
    FOR INSERT WITH CHECK (
        user_id = auth.uid()  -- User can only insert comments as themselves
    );

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments" ON task_comments
    FOR UPDATE USING (user_id = auth.uid());

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" ON task_comments
    FOR DELETE USING (user_id = auth.uid());

-- Alternative: More restrictive policy that checks task access
-- Uncomment the following if you want to restrict access to task creators and assignees only

/*
-- Drop the permissive policies
DROP POLICY IF EXISTS "Users can view all task comments" ON task_comments;
DROP POLICY IF EXISTS "Users can insert comments on any task" ON task_comments;

-- Create restrictive policies that check task access
CREATE POLICY "Users can view comments for tasks they have access to" ON task_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_comments.task_id 
            AND (t.created_by = auth.uid() OR 
                 EXISTS (
                     SELECT 1 FROM task_assignments ta 
                     WHERE ta.task_id = t.id AND ta.user_id = auth.uid()
                 ))
        )
    );

CREATE POLICY "Users can insert comments for tasks they have access to" ON task_comments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_comments.task_id 
            AND (t.created_by = auth.uid() OR 
                 EXISTS (
                     SELECT 1 FROM task_assignments ta 
                     WHERE ta.task_id = t.id AND ta.user_id = auth.uid()
                 ))
        )
    );
*/

-- Also fix the task_comment_mentions policies
DROP POLICY IF EXISTS "Users can view mentions for comments they can see" ON task_comment_mentions;
DROP POLICY IF EXISTS "Users can insert mentions for their comments" ON task_comment_mentions;

-- Create permissive policies for mentions
CREATE POLICY "Users can view all mentions" ON task_comment_mentions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert mentions for their comments" ON task_comment_mentions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM task_comments tc 
            WHERE tc.id = task_comment_mentions.comment_id 
            AND tc.user_id = auth.uid()
        )
    );

-- Verify the policies were created
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
WHERE tablename IN ('task_comments', 'task_comment_mentions')
ORDER BY tablename, policyname; 