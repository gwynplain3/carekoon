-- Fix visibility and management for virtual elder data
-- This allows caretakers to manage data for their virtual elders
-- AND allows unauthenticated virtual elders to see/manage their own data via their UUID

-- 1. Medicines
DROP POLICY IF EXISTS "Caretakers manage virtual medicines" ON public.medicines;
CREATE POLICY "Caretakers manage virtual medicines" ON public.medicines
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));

DROP POLICY IF EXISTS "Public manage virtual medicines" ON public.medicines;
CREATE POLICY "Public manage virtual medicines" ON public.medicines
FOR ALL USING (virtual_elder_id IS NOT NULL) WITH CHECK (virtual_elder_id IS NOT NULL);

-- 2. Todos (already partially done, but ensuring consistency)
DROP POLICY IF EXISTS "Caretakers manage virtual todos" ON public.todos;
CREATE POLICY "Caretakers manage virtual todos" ON public.todos
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));

DROP POLICY IF EXISTS "Public manage virtual todos" ON public.todos;
CREATE POLICY "Public manage virtual todos" ON public.todos
FOR ALL USING (virtual_elder_id IS NOT NULL) WITH CHECK (virtual_elder_id IS NOT NULL);

-- 3. Water Logs
DROP POLICY IF EXISTS "Caretakers manage virtual water" ON public.water_logs;
CREATE POLICY "Caretakers manage virtual water" ON public.water_logs
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));

DROP POLICY IF EXISTS "Public manage virtual water" ON public.water_logs;
CREATE POLICY "Public manage virtual water" ON public.water_logs
FOR ALL USING (virtual_elder_id IS NOT NULL) WITH CHECK (virtual_elder_id IS NOT NULL);

-- 4. Grocery Items
DROP POLICY IF EXISTS "Caretakers manage virtual groceries" ON public.grocery_items;
CREATE POLICY "Caretakers manage virtual groceries" ON public.grocery_items
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));

DROP POLICY IF EXISTS "Public manage virtual groceries" ON public.grocery_items;
CREATE POLICY "Public manage virtual groceries" ON public.grocery_items
FOR ALL USING (virtual_elder_id IS NOT NULL) WITH CHECK (virtual_elder_id IS NOT NULL);

-- 5. Health Logs
DROP POLICY IF EXISTS "Caretakers manage virtual health logs" ON public.health_logs;
CREATE POLICY "Caretakers manage virtual health logs" ON public.health_logs
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));

DROP POLICY IF EXISTS "Public manage virtual health logs" ON public.health_logs;
CREATE POLICY "Public manage virtual health logs" ON public.health_logs
FOR ALL USING (virtual_elder_id IS NOT NULL) WITH CHECK (virtual_elder_id IS NOT NULL);

-- 6. Diaries
DROP POLICY IF EXISTS "Caretakers manage virtual diaries" ON public.diaries;
CREATE POLICY "Caretakers manage virtual diaries" ON public.diaries
FOR ALL USING (virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid()));

DROP POLICY IF EXISTS "Public manage virtual diaries" ON public.diaries;
CREATE POLICY "Public manage virtual diaries" ON public.diaries
FOR ALL USING (virtual_elder_id IS NOT NULL) WITH CHECK (virtual_elder_id IS NOT NULL);
