-- Create task_comments table for chat functionality
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL,
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    mentions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create task_comment_mentions table for tracking mentions
CREATE TABLE IF NOT EXISTS task_comment_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES task_comments(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_task_comment_mentions_comment_id ON task_comment_mentions(comment_id);
CREATE INDEX IF NOT EXISTS idx_task_comment_mentions_user_id ON task_comment_mentions(mentioned_user_id);

-- Enable Row Level Security
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comment_mentions ENABLE ROW LEVEL SECURITY;

-- Create policies for task_comments
CREATE POLICY "Users can view comments for tasks they have access to" ON task_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_comments.task_id 
            AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can insert comments for tasks they have access to" ON task_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_comments.task_id 
            AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid())
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their own comments" ON task_comments
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON task_comments
    FOR DELETE USING (user_id = auth.uid());

-- Create policies for task_comment_mentions
CREATE POLICY "Users can view mentions for comments they can see" ON task_comment_mentions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM task_comments tc 
            JOIN tasks t ON t.id = tc.task_id
            WHERE tc.id = task_comment_mentions.comment_id 
            AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can insert mentions for their comments" ON task_comment_mentions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM task_comments tc 
            WHERE tc.id = task_comment_mentions.comment_id 
            AND tc.user_id = auth.uid()
        )
    );

-- Create function to handle mention notifications
CREATE OR REPLACE FUNCTION handle_mention_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert mentions into the mentions table
    IF NEW.mentions IS NOT NULL AND jsonb_array_length(NEW.mentions) > 0 THEN
        INSERT INTO task_comment_mentions (comment_id, mentioned_user_id)
        SELECT NEW.id, mentioned_user_id::UUID
        FROM jsonb_array_elements_text(NEW.mentions) AS mentioned_user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for mention notifications
CREATE TRIGGER trigger_mention_notifications
    AFTER INSERT ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION handle_mention_notifications();

-- Create function to get comments with user info
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
        u.username as user_username,
        u.role as user_role
    FROM task_comments tc
    LEFT JOIN users u ON u.id = tc.user_id
    WHERE tc.task_id = task_uuid
    ORDER BY tc.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 