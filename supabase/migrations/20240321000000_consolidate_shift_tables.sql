-- Drop existing tables if they exist
DROP TABLE IF EXISTS shift_swap_requests;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS shifts;
DROP TABLE IF EXISTS shift_templates;

-- Create shift_templates table
CREATE TABLE shift_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  shift_type VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#E3F2FD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create shifts table
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_users(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  shift_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  notes TEXT,
  role VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES auth_users(id),
  repeat_days TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create leave_requests table
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_users(id),
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  reviewer_id UUID REFERENCES auth_users(id),
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create shift_swap_requests table
CREATE TABLE shift_swap_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES auth_users(id),
  requested_user_id UUID NOT NULL REFERENCES auth_users(id),
  shift_id UUID NOT NULL REFERENCES shifts(id),
  proposed_shift_id UUID REFERENCES shifts(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  notes TEXT,
  reviewer_id UUID REFERENCES auth_users(id),
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_shifts_user_id ON shifts(user_id);
CREATE INDEX idx_shifts_start_time ON shifts(start_time);
CREATE INDEX idx_shifts_end_time ON shifts(end_time);
CREATE INDEX idx_shifts_shift_type ON shifts(shift_type);
CREATE INDEX idx_shifts_status ON shifts(status);

CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_start_date ON leave_requests(start_date);
CREATE INDEX idx_leave_requests_end_date ON leave_requests(end_date);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

CREATE INDEX idx_shift_swap_requests_requester_id ON shift_swap_requests(requester_id);
CREATE INDEX idx_shift_swap_requests_requested_user_id ON shift_swap_requests(requested_user_id);
CREATE INDEX idx_shift_swap_requests_shift_id ON shift_swap_requests(shift_id);
CREATE INDEX idx_shift_swap_requests_status ON shift_swap_requests(status);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_swap_requests_updated_at
  BEFORE UPDATE ON shift_swap_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Shift templates policies
DROP POLICY IF EXISTS "Users can view all templates" ON shift_templates;
DROP POLICY IF EXISTS "Only admins can manage templates" ON shift_templates;

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

-- Create shifts policies
DROP POLICY IF EXISTS "Users can view all shifts" ON shifts;
DROP POLICY IF EXISTS "Users can create shifts" ON shifts;
DROP POLICY IF EXISTS "Users can update their own shifts" ON shifts;
DROP POLICY IF EXISTS "Users can delete their own shifts" ON shifts;

CREATE POLICY "Users can view all shifts"
  ON shifts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create shifts"
  ON shifts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth_users
      WHERE auth_users.id = auth.uid()
      AND (auth_users.is_admin = true OR auth_users.role = 'admin')
    )
  );

CREATE POLICY "Users can update their own shifts or any shifts if admin"
  ON shifts FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM auth_users
      WHERE auth_users.id = auth.uid()
      AND (auth_users.is_admin = true OR auth_users.role = 'admin')
    )
  );

CREATE POLICY "Users can delete their own shifts or any shifts if admin"
  ON shifts FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM auth_users
      WHERE auth_users.id = auth.uid()
      AND (auth_users.is_admin = true OR auth_users.role = 'admin')
    )
  ); 