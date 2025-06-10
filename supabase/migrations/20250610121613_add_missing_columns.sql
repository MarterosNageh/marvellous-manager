-- Add proposed_shift_id column to shift_requests table
ALTER TABLE public.shift_requests 
ADD COLUMN IF NOT EXISTS proposed_shift_id UUID REFERENCES public.shifts(id);

-- Update existing records to have empty notes
UPDATE public.shift_requests SET notes = '' WHERE notes IS NULL;

-- Make notes column not nullable
ALTER TABLE public.shift_requests ALTER COLUMN notes SET NOT NULL; 