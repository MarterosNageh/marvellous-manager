-- Create user_balances table
CREATE TABLE IF NOT EXISTS user_balances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own balance"
  ON user_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all balances"
  ON user_balances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth_users
      WHERE auth_users.id = auth.uid()
      AND auth_users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update balances"
  ON user_balances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth_users
      WHERE auth_users.id = auth.uid()
      AND auth_users.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_balances_updated_at
  BEFORE UPDATE ON user_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
