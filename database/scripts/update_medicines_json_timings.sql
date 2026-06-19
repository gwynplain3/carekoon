-- Update medicines table to store multiple timings as JSONB
ALTER TABLE public.medicines 
ALTER COLUMN timing TYPE JSONB USING to_jsonb(timing);

COMMENT ON COLUMN public.medicines.timing IS 'Array of strings representing the timing for each dose';
