-- Fix RLS for diaries to allow both real and virtual elders to manage their data
-- and explicitly allow INSERT with WITH CHECK

-- 1. Ensure virtual_elder_id exists (just in case)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='diaries' AND column_name='virtual_elder_id') THEN
        ALTER TABLE public.diaries ADD COLUMN virtual_elder_id UUID REFERENCES public.virtual_elders(id) ON DELETE CASCADE;
        ALTER TABLE public.diaries ALTER COLUMN user_id DROP NOT NULL;
    END IF;
END $$;

-- 2. Clean up old policies
DROP POLICY IF EXISTS "Users can manage own diaries" ON public.diaries;
DROP POLICY IF EXISTS "Elders manage own diaries" ON public.diaries;
DROP POLICY IF EXISTS "Caretakers manage diaries" ON public.diaries;
DROP POLICY IF EXISTS "Caretakers manage virtual diaries" ON public.diaries;
DROP POLICY IF EXISTS "Public manage virtual diaries" ON public.diaries;
DROP POLICY IF EXISTS "Virtual elders see own diaries" ON public.diaries;

-- 3. New Unified Policies

-- Policy for real users (elder_self or registered elders)
-- We use FOR ALL which covers SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "Elders manage own diaries" ON public.diaries 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy for virtual elders (unauthenticated, identified by virtual_elder_id)
-- Note: In a production app, we'd use a more secure way to identify virtual elders.
-- For now, we allow any action if virtual_elder_id is provided.
CREATE POLICY "Virtual elders manage own diaries" ON public.diaries
FOR ALL USING (virtual_elder_id IS NOT NULL) WITH CHECK (virtual_elder_id IS NOT NULL);

-- Policy for caretakers to manage diaries of their elders
CREATE POLICY "Caretakers manage linked diaries" ON public.diaries
FOR ALL USING (
  user_id IN (SELECT elder_id FROM public.caretaker_elder_links WHERE caretaker_id = auth.uid()) OR
  virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid())
);
