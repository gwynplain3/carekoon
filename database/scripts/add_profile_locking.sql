-- Add locking feature to profiles and virtual elders
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_locked BOOLEAN DEFAULT false;
ALTER TABLE public.virtual_elders ADD COLUMN IF NOT EXISTS is_profile_locked BOOLEAN DEFAULT false;

-- Policy to allow caretakers to update the lock status of their real elders
DROP POLICY IF EXISTS "Caretakers can lock elder profiles" ON public.profiles;
CREATE POLICY "Caretakers can lock elder profiles" ON public.profiles
FOR UPDATE USING (public.is_caretaker_of(id))
WITH CHECK (public.is_caretaker_of(id));

-- Policy for virtual elders already covered by "Caretakers manage own virtual elders"
