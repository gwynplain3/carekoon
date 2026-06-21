-- Fix Appointments table to support virtual elders and caretaker management

-- 1. Add virtual_elder_id column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='virtual_elder_id') THEN
        ALTER TABLE public.appointments ADD COLUMN virtual_elder_id UUID REFERENCES public.virtual_elders(id) ON DELETE CASCADE;
        ALTER TABLE public.appointments ALTER COLUMN user_id DROP NOT NULL;
    END IF;
END $$;

-- 2. Enable RLS (if not already)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 3. Clean up old policies
DROP POLICY IF EXISTS "Users manage own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Caretakers manage virtual appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public manage virtual appointments" ON public.appointments;

-- 4. New Unified Policies

-- Real user / self-care elder
CREATE POLICY "Elders manage own appointments" ON public.appointments
FOR ALL USING (auth.uid() = user_id OR user_id IN (SELECT elder_id FROM public.caretaker_elder_links WHERE caretaker_id = auth.uid()))
WITH CHECK (auth.uid() = user_id OR user_id IN (SELECT elder_id FROM public.caretaker_elder_links WHERE caretaker_id = auth.uid()));

-- Virtual elders
CREATE POLICY "Caretakers manage virtual appointments" ON public.appointments
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()))
WITH CHECK (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));

-- Public visibility for virtual elders (for unauthenticated login code access)
CREATE POLICY "Public manage virtual appointments" ON public.appointments
FOR ALL USING (virtual_elder_id IS NOT NULL) WITH CHECK (virtual_elder_id IS NOT NULL);
