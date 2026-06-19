-- Add Recurring Tasks Feature
-- This allows tasks to repeat every day automatically

-- 1. Update Todos Table
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Update Medicines Table
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT true;
-- Ensure last_updated_at exists (it should, but just in case)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medicines' AND column_name='last_updated_at') THEN
        ALTER TABLE public.medicines ADD COLUMN last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;
