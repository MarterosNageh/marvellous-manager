
-- Enable Row Level Security on shift_requests table
ALTER TABLE public.shift_requests ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own shift requests
CREATE POLICY "Users can view their own shift requests" 
  ON public.shift_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to create their own shift requests
CREATE POLICY "Users can create their own shift requests" 
  ON public.shift_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow admins and seniors to view all shift requests
CREATE POLICY "Admins and seniors can view all shift requests" 
  ON public.shift_requests 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM auth_users 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR role = 'senior')
    )
  );

-- Allow admins and seniors to update shift request status
CREATE POLICY "Admins and seniors can update shift requests" 
  ON public.shift_requests 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM auth_users 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR role = 'senior')
    )
  );

-- Update the check constraint to allow the correct request types
ALTER TABLE public.shift_requests DROP CONSTRAINT IF EXISTS shift_requests_request_type_check;
ALTER TABLE public.shift_requests ADD CONSTRAINT shift_requests_request_type_check 
  CHECK (request_type IN ('leave', 'extra', 'swap', 'custom'));
