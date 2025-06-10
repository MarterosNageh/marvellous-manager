-- Add notes column to shift_requests table
ALTER TABLE public.shift_requests ADD COLUMN notes TEXT;

-- Update existing records to have empty notes
UPDATE public.shift_requests SET notes = '' WHERE notes IS NULL;

-- Make notes column not nullable
ALTER TABLE public.shift_requests ALTER COLUMN notes SET NOT NULL; 