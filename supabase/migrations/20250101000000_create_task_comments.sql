-- Create task_comments table for chat functionality
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  mentions JSONB DEFAULT '[]'::jsonb, -- Array of mentioned user IDs
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX task_comments_task_id_idx ON task_comments(task_id);
CREATE INDEX task_comments_user_id_idx ON task_comments(user_id);
CREATE INDEX task_comments_created_at_idx ON task_comments(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_comments
CREATE POLICY "Users can view all task comments"
  ON task_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create task comments"
  ON task_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task comments"
  ON task_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task comments"
  ON task_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create task_comment_mentions table for tracking mentions
CREATE TABLE task_comment_mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES task_comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(comment_id, mentioned_user_id)
);

-- Create indexes for mentions
CREATE INDEX task_comment_mentions_comment_id_idx ON task_comment_mentions(comment_id);
CREATE INDEX task_comment_mentions_mentioned_user_id_idx ON task_comment_mentions(mentioned_user_id);
CREATE INDEX task_comment_mentions_task_id_idx ON task_comment_mentions(task_id);
CREATE INDEX task_comment_mentions_is_read_idx ON task_comment_mentions(is_read);

-- Enable RLS for mentions
ALTER TABLE task_comment_mentions ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_comment_mentions
CREATE POLICY "Users can view mentions for tasks they're involved in"
  ON task_comment_mentions FOR SELECT
  TO authenticated
  USING (
    mentioned_user_id = auth.uid() OR
    auth.uid() IN (
      SELECT user_id FROM task_assignments WHERE task_id = task_comment_mentions.task_id
    )
  );

CREATE POLICY "Users can create mentions when creating comments"
  ON task_comment_mentions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM task_comments WHERE id = comment_id
    )
  );

CREATE POLICY "Users can update their own mention status"
  ON task_comment_mentions FOR UPDATE
  TO authenticated
  USING (mentioned_user_id = auth.uid());

-- Function to extract mentions from message text
CREATE OR REPLACE FUNCTION extract_mentions(message_text TEXT)
RETURNS UUID[] AS $$
DECLARE
  mention_pattern TEXT := '@([a-zA-Z0-9_]+)';
  username TEXT;
  user_id UUID;
  mentions UUID[] := '{}';
BEGIN
  -- Extract usernames from @mentions
  FOR username IN 
    SELECT regexp_matches(message_text, mention_pattern, 'g')
  LOOP
    -- Find user ID by username
    SELECT id INTO user_id 
    FROM auth_users 
    WHERE username = username;
    
    IF user_id IS NOT NULL THEN
      mentions := array_append(mentions, user_id);
    END IF;
  END LOOP;
  
  RETURN mentions;
END;
$$ LANGUAGE plpgsql;

-- Function to create mentions when a comment is created
CREATE OR REPLACE FUNCTION create_comment_mentions()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_user_id UUID;
  mentions UUID[];
BEGIN
  -- Extract mentions from the message
  mentions := extract_mentions(NEW.message);
  
  -- Create mention records
  FOREACH mentioned_user_id IN ARRAY mentions
  LOOP
    INSERT INTO task_comment_mentions (comment_id, mentioned_user_id, task_id)
    VALUES (NEW.id, mentioned_user_id, NEW.task_id)
    ON CONFLICT (comment_id, mentioned_user_id) DO NOTHING;
  END LOOP;
  
  -- Update the mentions JSONB field
  NEW.mentions := to_jsonb(mentions);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create mentions
CREATE TRIGGER create_mentions_on_comment
  AFTER INSERT ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_mentions(); 