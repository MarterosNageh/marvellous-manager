-- Enable RLS on auth_users table
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;

-- Allow administrators to manage all users
CREATE POLICY "Administrators can manage all users"
    ON auth_users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth_users au
            WHERE au.id = auth.uid()
            AND au.is_admin = true
        )
    );

-- Allow users to read their own data
CREATE POLICY "Users can read their own data"
    ON auth_users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Allow users to update their own data (except admin status)
CREATE POLICY "Users can update their own data"
    ON auth_users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        AND is_admin = (SELECT is_admin FROM auth_users WHERE id = auth.uid())
    );

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM auth_users
        WHERE id = auth.uid()
        AND is_admin = true
    );
$$; 