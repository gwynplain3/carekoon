-- 1. Create a table for 'Virtual Elders' fully managed by Caretakers
-- These elders do NOT have a Supabase Auth entry.
CREATE TABLE IF NOT EXISTS public.virtual_elders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caretaker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT NOT NULL,
  pin_code TEXT CHECK (length(pin_code) = 4), -- Optional PIN for simple login if needed later
  avatar_url TEXT,
  font_size INT DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.virtual_elders ENABLE ROW LEVEL SECURITY;

-- 2. Caretakers can manage their own virtual elders
CREATE POLICY "Caretakers manage own virtual elders" 
ON public.virtual_elders FOR ALL 
USING (auth.uid() = caretaker_id);

-- 3. Update health tables to support virtual_elder_id
-- We add a column to each health table that references EITHER a real profile OR a virtual elder.
-- Since the current tables reference public.profiles(id), we'll add a 'virtual_elder_id' column for isolation.

-- Todos
ALTER TABLE public.todos ADD COLUMN virtual_elder_id UUID REFERENCES public.virtual_elders(id) ON DELETE CASCADE;
ALTER TABLE public.todos ALTER COLUMN user_id DROP NOT NULL;

-- Medicines
ALTER TABLE public.medicines ADD COLUMN virtual_elder_id UUID REFERENCES public.virtual_elders(id) ON DELETE CASCADE;
ALTER TABLE public.medicines ALTER COLUMN user_id DROP NOT NULL;

-- Water Logs
ALTER TABLE public.water_logs ADD COLUMN virtual_elder_id UUID REFERENCES public.virtual_elders(id) ON DELETE CASCADE;
ALTER TABLE public.water_logs ALTER COLUMN user_id DROP NOT NULL;

-- Grocery Items
ALTER TABLE public.grocery_items ADD COLUMN virtual_elder_id UUID REFERENCES public.virtual_elders(id) ON DELETE CASCADE;
ALTER TABLE public.grocery_items ALTER COLUMN user_id DROP NOT NULL;

-- Health Logs
ALTER TABLE public.health_logs ADD COLUMN virtual_elder_id UUID REFERENCES public.virtual_elders(id) ON DELETE CASCADE;
ALTER TABLE public.health_logs ALTER COLUMN user_id DROP NOT NULL;

-- 4. Update Policies to allow Caretakers to see data for their virtual elders
CREATE POLICY "Caretakers see virtual elder todos" ON public.todos
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));

CREATE POLICY "Caretakers see virtual elder medicines" ON public.medicines
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));

CREATE POLICY "Caretakers see virtual elder water" ON public.water_logs
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));

CREATE POLICY "Caretakers see virtual elder groceries" ON public.grocery_items
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));

CREATE POLICY "Caretakers see virtual elder health logs" ON public.health_logs
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));
