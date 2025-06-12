-- Function to get task comments with user information
CREATE OR REPLACE FUNCTION get_task_comments(task_id UUID)
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
  JOIN auth_users au ON tc.user_id = au.id
  WHERE tc.task_id = get_task_comments.task_id
  ORDER BY tc.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a task comment
CREATE OR REPLACE FUNCTION create_task_comment(
  p_task_id UUID,
  p_user_id UUID,
  p_message TEXT
)
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
DECLARE
  new_comment_id UUID;
  extracted_mentions JSONB;
BEGIN
  -- Extract mentions from message
  SELECT to_jsonb(array_agg(au.id)) INTO extracted_mentions
  FROM regexp_matches(p_message, '@([a-zA-Z0-9_]+)', 'g') AS matches(username)
  JOIN auth_users au ON au.username = matches[1];
  
  -- Insert the comment
  INSERT INTO task_comments (task_id, user_id, message, mentions)
  VALUES (p_task_id, p_user_id, p_message, COALESCE(extracted_mentions, '[]'::jsonb))
  RETURNING id INTO new_comment_id;
  
  -- Create mention records
  IF extracted_mentions IS NOT NULL THEN
    INSERT INTO task_comment_mentions (comment_id, mentioned_user_id, task_id)
    SELECT new_comment_id, mentioned_user_id::UUID, p_task_id
    FROM jsonb_array_elements_text(extracted_mentions) AS mentioned_user_id
    ON CONFLICT (comment_id, mentioned_user_id) DO NOTHING;
  END IF;
  
  -- Return the created comment with user info
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
  JOIN auth_users au ON tc.user_id = au.id
  WHERE tc.id = new_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comment count for a task
CREATE OR REPLACE FUNCTION get_task_comment_count(task_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM task_comments
    WHERE task_comments.task_id = get_task_comment_count.task_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get FCM tokens for users
CREATE OR REPLACE FUNCTION get_user_fcm_tokens(user_ids UUID[])
RETURNS TABLE (fcm_token TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT ft.fcm_token
  FROM fcm_tokens ft
  WHERE ft.user_id = ANY(user_ids)
    AND ft.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 