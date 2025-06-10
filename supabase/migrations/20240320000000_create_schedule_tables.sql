-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('morning', 'night', 'over night')),
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  color TEXT
);

-- Create shift templates table
CREATE TABLE IF NOT EXISTS shift_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('morning', 'night', 'over night')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  color TEXT
);

-- Create leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RLS policies
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Shifts policies
CREATE POLICY "Users can view all shifts"
  ON shifts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own shifts"
  ON shifts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shifts"
  ON shifts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shifts"
  ON shifts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Shift templates policies
CREATE POLICY "Users can view all templates"
  ON shift_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage templates"
  ON shift_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'isAdmin' = 'true'
    )
  );

-- Leave requests policies
CREATE POLICY "Users can view all leave requests"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own leave requests"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leave requests"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leave requests"
  ON leave_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create functions to handle timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER handle_shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Update shifts table to match colors from templates
UPDATE shifts s
SET color = (
    SELECT st.color 
    FROM shift_templates st 
    WHERE st.shift_type = s.shift_type 
    ORDER BY st.created_at DESC 
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 
    FROM shift_templates st 
    WHERE st.shift_type = s.shift_type
);

-- For any remaining shifts without a matching template, set default colors
UPDATE shifts s
SET color = CASE 
    WHEN shift_type = 'morning' THEN '#E3F2FD'
    WHEN shift_type = 'night' THEN '#EDE7F6'
    WHEN shift_type = 'over night' THEN '#FFF3E0'
    ELSE '#E3F2FD'
END
WHERE color IS NULL; 