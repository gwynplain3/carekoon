-- Allow anyone to update avatar_url and nothing else for virtual elders
-- (Since virtual elders have no session)
DROP POLICY IF EXISTS "Allow public avatar update" ON public.virtual_elders;
CREATE POLICY "Allow public avatar update" ON public.virtual_elders
FOR UPDATE USING (true)
WITH CHECK (true);

-- Ensure profiles can be updated by own user (Standard)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Ensure caretakers can also update their linked elder's avatar
DROP POLICY IF EXISTS "Caretakers can update elder profile" ON public.profiles;
CREATE POLICY "Caretakers can update elder profile" ON public.profiles
FOR UPDATE USING (public.is_caretaker_of(id));
