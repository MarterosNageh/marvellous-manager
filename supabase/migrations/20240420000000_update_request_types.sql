-- Drop the existing constraint if it exists
ALTER TABLE public.shift_requests DROP CONSTRAINT IF EXISTS shift_requests_request_type_check;

-- Add new constraint with all valid request types
ALTER TABLE public.shift_requests ADD CONSTRAINT shift_requests_request_type_check 
  CHECK (request_type IN ('day-off', 'unpaid-leave', 'extra-days', 'public-holiday', 'swap', 'leave', 'extra', 'custom')); 