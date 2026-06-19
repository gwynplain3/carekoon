-- This script ensures the virtual_elders table is correctly configured
-- and that all login codes are uppercase for easy entry

-- 1. Ensure login_code column exists (if not already added)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='virtual_elders' AND column_name='login_code') THEN
        ALTER TABLE public.virtual_elders ADD COLUMN login_code TEXT UNIQUE;
    END IF;
END $$;

-- 2. Set all existing codes to UPPERCASE
UPDATE public.virtual_elders SET login_code = UPPER(login_code);

-- 3. Add a public select policy so elders can check their code without logging in
-- (Required for the Welcome page code check)
DROP POLICY IF EXISTS "Elders can check their own codes" ON public.virtual_elders;
CREATE POLICY "Elders can check their own codes" 
ON public.virtual_elders FOR SELECT 
USING (true);

-- 4. Ensure RLS is still on
ALTER TABLE public.virtual_elders ENABLE ROW LEVEL SECURITY;
