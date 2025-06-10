-- Add balance column to public.auth_users
ALTER TABLE public.auth_users 
ADD COLUMN IF NOT EXISTS balance INTEGER DEFAULT 80;

-- Set default balance for existing users
UPDATE public.auth_users 
SET balance = 80 
WHERE balance IS NULL;

-- Create or replace function to update user balance
CREATE OR REPLACE FUNCTION public.handle_user_balance_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.balance IS NULL THEN
        NEW.balance := 80;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new users
DROP TRIGGER IF EXISTS set_user_balance ON public.auth_users;
CREATE TRIGGER set_user_balance
    BEFORE INSERT ON public.auth_users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_balance_update();

-- Grant permissions (adjust these based on your application's user roles)
GRANT SELECT ON public.auth_users TO authenticated;
GRANT UPDATE (balance) ON public.auth_users TO authenticated;

-- Create policy for updating balance (only admins can update)
CREATE POLICY "Only admins can update balance"
    ON public.auth_users
    FOR UPDATE
    USING (is_admin = true);

-- Enable RLS if not already enabled
ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY; 