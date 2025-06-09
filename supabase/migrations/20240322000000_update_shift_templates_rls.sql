-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all templates" ON shift_templates;
DROP POLICY IF EXISTS "Only admins can manage templates" ON shift_templates;

-- Create new policies
CREATE POLICY "Users can view all templates"
  ON shift_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage templates"
  ON shift_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_users
      WHERE auth_users.id = auth.uid()
      AND (auth_users.is_admin = true OR auth_users.role = 'admin')
    )
  ); 