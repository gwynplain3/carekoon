-- Enable caretakers to update the profile (specifically avatar_url) of elders they manage
DROP POLICY IF EXISTS "Caretakers can update elder profiles" ON public.profiles;

CREATE POLICY "Caretakers can update elder profiles" 
ON public.profiles
FOR UPDATE
USING (public.is_caretaker_of(id))
WITH CHECK (public.is_caretaker_of(id));

-- Also ensure they can SELECT the profiles (already should be covered by "Profiles are public", but just in case)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);
