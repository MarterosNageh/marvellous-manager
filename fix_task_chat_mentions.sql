-- Comprehensive fix for task chat mentions
-- This script resolves the ambiguous column reference "mentioned_user_id" error

-- Step 1: Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_comment_mentions_mentioned_user_id_fkey'
        AND table_name = 'task_comment_mentions'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE task_comment_mentions 
        ADD CONSTRAINT task_comment_mentions_mentioned_user_id_fkey 
        FOREIGN KEY (mentioned_user_id) REFERENCES auth_users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint added successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Step 2: Fix RLS policies that reference non-existent assigned_to column
DROP POLICY IF EXISTS "Users can view comments for tasks they have access to" ON task_comments;
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

DROP POLICY IF EXISTS "Users can insert comments for tasks they have access to" ON task_comments;
CREATE POLICY "Users can insert comments for tasks they have access to" ON task_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_comments.task_id 
            AND (t.created_by = auth.uid() OR 
                 EXISTS (
                     SELECT 1 FROM task_assignments ta 
                     WHERE ta.task_id = t.id AND ta.user_id = auth.uid()
                 ))
        )
        AND user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can view mentions for comments they can see" ON task_comment_mentions;
CREATE POLICY "Users can view mentions for comments they can see" ON task_comment_mentions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM task_comments tc 
            JOIN tasks t ON t.id = tc.task_id
            WHERE tc.id = task_comment_mentions.comment_id 
            AND (t.created_by = auth.uid() OR 
                 EXISTS (
                     SELECT 1 FROM task_assignments ta 
                     WHERE ta.task_id = t.id AND ta.user_id = auth.uid()
                 ))
        )
    );

-- Step 3: Fix the handle_mention_notifications function to resolve ambiguous column reference
CREATE OR REPLACE FUNCTION handle_mention_notifications()
RETURNS TRIGGER AS $$
DECLARE
    user_id UUID;
    user_exists BOOLEAN;
BEGIN
    -- Insert mentions into the mentions table
    IF NEW.mentions IS NOT NULL AND jsonb_array_length(NEW.mentions) > 0 THEN
        FOR user_id IN 
            SELECT mentioned_user_id::UUID
            FROM jsonb_array_elements_text(NEW.mentions) AS mentioned_user_id
        LOOP
            -- Check if the user exists before inserting
            SELECT EXISTS(SELECT 1 FROM auth_users WHERE id = user_id) INTO user_exists;
            
            IF user_exists THEN
                INSERT INTO task_comment_mentions (comment_id, mentioned_user_id)
                VALUES (NEW.id, user_id)
                ON CONFLICT (comment_id, mentioned_user_id) DO NOTHING;
            ELSE
                RAISE WARNING 'User with ID % does not exist, skipping mention insertion', user_id;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS trigger_mention_notifications ON task_comments;
CREATE TRIGGER trigger_mention_notifications
    AFTER INSERT ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION handle_mention_notifications();

-- Step 5: Fix the get_task_comments_with_users function to use auth_users
CREATE OR REPLACE FUNCTION get_task_comments_with_users(task_uuid UUID)
RETURNS TABLE (
    id UUID,
    task_id UUID,
    user_id UUID,
    message TEXT,
    mentions JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_username TEXT,
    user_role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.id,
        tc.task_id,
        tc.user_id,
        tc.message,
        tc.mentions,
        tc.created_at,
        tc.updated_at,
        au.username as user_username,
        COALESCE(au.role, 'user') as user_role
    FROM task_comments tc
    LEFT JOIN auth_users au ON au.id = tc.user_id
    WHERE tc.task_id = task_uuid
    ORDER BY tc.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create a function to manually fix existing mentions if needed
CREATE OR REPLACE FUNCTION fix_existing_mentions()
RETURNS void AS $$
DECLARE
    comment_record RECORD;
    user_id UUID;
BEGIN
    -- Process all existing comments that have mentions but no mention records
    FOR comment_record IN 
        SELECT id, mentions, task_id
        FROM task_comments 
        WHERE mentions IS NOT NULL 
        AND jsonb_array_length(mentions) > 0
        AND NOT EXISTS (
            SELECT 1 FROM task_comment_mentions 
            WHERE comment_id = task_comments.id
        )
    LOOP
        -- Insert mention records for each mentioned user
        FOR user_id IN 
            SELECT mentioned_user_id::UUID
            FROM jsonb_array_elements_text(comment_record.mentions) AS mentioned_user_id
        LOOP
            INSERT INTO task_comment_mentions (comment_id, mentioned_user_id)
            VALUES (comment_record.id, user_id)
            ON CONFLICT (comment_id, mentioned_user_id) DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Existing mentions have been processed';
END;
$$ LANGUAGE plpgsql;

-- Step 7: Run the fix for existing mentions (optional - uncomment if needed)
-- SELECT fix_existing_mentions();

-- Step 8: Verify the fix
DO $$
BEGIN
    RAISE NOTICE 'Task chat mentions fix completed successfully';
    RAISE NOTICE 'Foreign key constraint: %', 
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'task_comment_mentions_mentioned_user_id_fkey'
        ) THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE 'Function handle_mention_notifications: %', 
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'handle_mention_notifications'
        ) THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE 'Trigger trigger_mention_notifications: %', 
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'trigger_mention_notifications'
        ) THEN 'EXISTS' ELSE 'MISSING' END;
END $$; 