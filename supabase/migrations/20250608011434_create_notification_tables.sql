-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    auth TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, endpoint)
);

-- Create fcm_tokens table
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL,
    device_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, fcm_token)
);

-- Add RLS policies
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own subscriptions
CREATE POLICY "Users can read their own push subscriptions"
    ON public.push_subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow users to manage their own subscriptions
CREATE POLICY "Users can manage their own push subscriptions"
    ON public.push_subscriptions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow users to read their own FCM tokens
CREATE POLICY "Users can read their own FCM tokens"
    ON public.fcm_tokens
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow users to manage their own FCM tokens
CREATE POLICY "Users can manage their own FCM tokens"
    ON public.fcm_tokens
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);
CREATE INDEX fcm_tokens_user_id_idx ON public.fcm_tokens(user_id);
CREATE INDEX push_subscriptions_is_active_idx ON public.push_subscriptions(is_active);
CREATE INDEX fcm_tokens_is_active_idx ON public.fcm_tokens(is_active); 