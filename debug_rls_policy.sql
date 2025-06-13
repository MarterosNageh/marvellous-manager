-- Diagnostic script to debug RLS policy issues
-- Run this script to understand why the RLS policy is blocking insertions

-- Check current user
SELECT auth.uid() as current_user_id;

-- Check if the user exists in auth_users
SELECT id, username, role FROM auth_users WHERE id = auth.uid();

-- Check if the task exists
-- Replace 'your-task-id' with the actual task ID
SELECT id, title, created_by FROM tasks WHERE id = 'your-task-id';

-- Check if the user is assigned to the task
-- Replace 'your-task-id' with the actual task ID
SELECT ta.*, au.username 
FROM task_assignments ta 
JOIN auth_users au ON au.id = ta.user_id 
WHERE ta.task_id = 'your-task-id' AND ta.user_id = auth.uid();

-- Check if the user is the creator of the task
-- Replace 'your-task-id' with the actual task ID
SELECT id, title, created_by 
FROM tasks 
WHERE id = 'your-task-id' AND created_by = auth.uid();

-- Test the RLS policy logic manually
-- Replace 'your-task-id' with the actual task ID
SELECT 
    EXISTS (
        SELECT 1 FROM tasks t 
        WHERE t.id = 'your-task-id' 
        AND (t.created_by = auth.uid() OR 
             EXISTS (
                 SELECT 1 FROM task_assignments ta 
                 WHERE ta.task_id = t.id AND ta.user_id = auth.uid()
             ))
    ) as can_access_task;

-- Check all task assignments for the task
-- Replace 'your-task-id' with the actual task ID
SELECT ta.*, au.username 
FROM task_assignments ta 
JOIN auth_users au ON au.id = ta.user_id 
WHERE ta.task_id = 'your-task-id';

-- Check all users who can access the task
-- Replace 'your-task-id' with the actual task ID
SELECT DISTINCT au.id, au.username, au.role,
       CASE 
           WHEN t.created_by = au.id THEN 'Creator'
           WHEN ta.user_id IS NOT NULL THEN 'Assigned'
           ELSE 'No Access'
       END as access_type
FROM auth_users au
CROSS JOIN tasks t
LEFT JOIN task_assignments ta ON ta.task_id = t.id AND ta.user_id = au.id
WHERE t.id = 'your-task-id'; 