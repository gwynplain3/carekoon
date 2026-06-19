-- Restore Virtual Elder Infrastructure & Fix Policies
-- This script safely re-adds missing columns and configures RLS

-- 1. Ensure virtual_elders table exists
CREATE TABLE IF NOT EXISTS public.virtual_elders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caretaker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT NOT NULL,
  login_code TEXT UNIQUE,
  avatar_url TEXT,
  font_size INT DEFAULT 20,
  is_profile_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.virtual_elders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Caretakers manage own virtual elders" ON public.virtual_elders;
CREATE POLICY "Caretakers manage own virtual elders" ON public.virtual_elders FOR ALL USING (auth.uid() = caretaker_id);
DROP POLICY IF EXISTS "Elders can check their own codes" ON public.virtual_elders;
CREATE POLICY "Elders can check their own codes" ON public.virtual_elders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public virtual elder self update" ON public.virtual_elders;
CREATE POLICY "Public virtual elder self update" ON public.virtual_elders FOR UPDATE USING (true) WITH CHECK (true);

-- 2. Safely add virtual_elder_id columns to health tables
DO $$ 
BEGIN 
    -- Medicines
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medicines' AND column_name='virtual_elder_id') THEN
        ALTER TABLE public.medicines ADD COLUMN virtual_elder_id UUID REFERENCES public.virtual_elders(id) ON DELETE CASCADE;
        ALTER TABLE public.medicines ALTER COLUMN user_id DROP NOT NULL;
    END IF;
    -- Todos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='todos' AND column_name='virtual_elder_id') THEN
        ALTER TABLE public.todos ADD COLUMN virtual_elder_id UUID REFERENCES public.virtual_elders(id) ON DELETE CASCADE;
        ALTER TABLE public.todos ALTER COLUMN user_id DROP NOT NULL;
    END IF;
    -- Water Logs
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='water_logs' AND column_name='virtual_elder_id') THEN
        ALTER TABLE public.water_logs ADD COLUMN virtual_elder_id UUID REFERENCES public.virtual_elders(id) ON DELETE CASCADE;
        ALTER TABLE public.water_logs ALTER COLUMN user_id DROP NOT NULL;
    END IF;
    -- Grocery Items
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='grocery_items' AND column_name='virtual_elder_id') THEN
        ALTER TABLE public.grocery_items ADD COLUMN virtual_elder_id UUID REFERENCES public.virtual_elders(id) ON DELETE CASCADE;
        ALTER TABLE public.grocery_items ALTER COLUMN user_id DROP NOT NULL;
    END IF;
    -- Health Logs
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='health_logs' AND column_name='virtual_elder_id') THEN
        ALTER TABLE public.health_logs ADD COLUMN virtual_elder_id UUID REFERENCES public.virtual_elders(id) ON DELETE CASCADE;
        ALTER TABLE public.health_logs ALTER COLUMN user_id DROP NOT NULL;
    END IF;
    -- Diaries
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='diaries' AND column_name='virtual_elder_id') THEN
        ALTER TABLE public.diaries ADD COLUMN virtual_elder_id UUID REFERENCES public.virtual_elders(id) ON DELETE CASCADE;
        ALTER TABLE public.diaries ALTER COLUMN user_id DROP NOT NULL;
    END IF;
END $$;

-- 3. Configure RLS Policies for Virtual Data Visibility
-- Each table needs: 
-- A. Caretaker access (via caretaker_id link)
-- B. Public/Virtual access (unauthenticated)

-- Medicines
DROP POLICY IF EXISTS "Caretakers manage virtual medicines" ON public.medicines;
CREATE POLICY "Caretakers manage virtual medicines" ON public.medicines
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));
DROP POLICY IF EXISTS "Public manage virtual medicines" ON public.medicines;
CREATE POLICY "Public manage virtual medicines" ON public.medicines
FOR ALL USING (virtual_elder_id IS NOT NULL) WITH CHECK (virtual_elder_id IS NOT NULL);

-- Todos
DROP POLICY IF EXISTS "Caretakers manage virtual todos" ON public.todos;
CREATE POLICY "Caretakers manage virtual todos" ON public.todos
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));
DROP POLICY IF EXISTS "Public manage virtual todos" ON public.todos;
CREATE POLICY "Public manage virtual todos" ON public.todos
FOR ALL USING (virtual_elder_id IS NOT NULL) WITH CHECK (virtual_elder_id IS NOT NULL);

-- Water Logs
DROP POLICY IF EXISTS "Caretakers manage virtual water" ON public.water_logs;
CREATE POLICY "Caretakers manage virtual water" ON public.water_logs
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));
DROP POLICY IF EXISTS "Public manage virtual water" ON public.water_logs;
CREATE POLICY "Public manage virtual water" ON public.water_logs
FOR ALL USING (virtual_elder_id IS NOT NULL) WITH CHECK (virtual_elder_id IS NOT NULL);

-- Grocery Items
DROP POLICY IF EXISTS "Caretakers manage virtual groceries" ON public.grocery_items;
CREATE POLICY "Caretakers manage virtual groceries" ON public.grocery_items
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));
DROP POLICY IF EXISTS "Public manage virtual groceries" ON public.grocery_items;
CREATE POLICY "Public manage virtual groceries" ON public.grocery_items
FOR ALL USING (virtual_elder_id IS NOT NULL) WITH CHECK (virtual_elder_id IS NOT NULL);

-- Health Logs
DROP POLICY IF EXISTS "Caretakers manage virtual health logs" ON public.health_logs;
CREATE POLICY "Caretakers manage virtual health logs" ON public.health_logs
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));
DROP POLICY IF EXISTS "Public manage virtual health logs" ON public.health_logs;
CREATE POLICY "Public manage virtual health logs" ON public.health_logs
FOR ALL USING (virtual_elder_id IS NOT NULL) WITH CHECK (virtual_elder_id IS NOT NULL);

-- Diaries
DROP POLICY IF EXISTS "Caretakers manage virtual diaries" ON public.diaries;
CREATE POLICY "Caretakers manage virtual diaries" ON public.diaries
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));
DROP POLICY IF EXISTS "Public manage virtual diaries" ON public.diaries;
CREATE POLICY "Public manage virtual diaries" ON public.diaries
FOR ALL USING (virtual_elder_id IS NOT NULL) WITH CHECK (virtual_elder_id IS NOT NULL);
