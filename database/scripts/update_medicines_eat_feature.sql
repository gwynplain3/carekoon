-- Update medicines table for Eat! functionality
ALTER TABLE public.medicines 
ADD COLUMN total_doses INT DEFAULT 1,
ADD COLUMN remaining_doses INT DEFAULT 1,
ADD COLUMN last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Add a comment to describe the functionality
COMMENT ON COLUMN public.medicines.total_doses IS 'How many times the medicine should be taken per day';
COMMENT ON COLUMN public.medicines.remaining_doses IS 'How many doses are left to be taken today';
