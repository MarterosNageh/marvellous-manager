-- Fix for ambiguous column reference "mentioned_user_id"
-- This script adds the missing foreign key constraint to resolve the SQL error

-- Add foreign key constraint if it doesn't exist
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

-- Update the handle_mention_notifications function to fix the ambiguous column reference
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