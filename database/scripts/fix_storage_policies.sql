-- Storage Policies for Avatars bucket
-- 1. Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow Public Access (View)
DROP POLICY IF EXISTS "Public View" ON storage.objects;
CREATE POLICY "Public View" ON storage.objects 
FOR SELECT USING (bucket_id = 'avatars');

-- 3. Allow Caretakers to upload avatars for their virtual elders
DROP POLICY IF EXISTS "Caretakers upload virtual avatars" ON storage.objects;
CREATE POLICY "Caretakers upload virtual avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = 'virtual_elders' AND
  EXISTS (
    SELECT 1 FROM public.virtual_elders 
    WHERE id::text = (storage.foldername(name))[2] 
    AND caretaker_id = auth.uid()
  )
);

-- 4. Allow Caretakers to upload avatars for their real elders
DROP POLICY IF EXISTS "Caretakers upload real avatars" ON storage.objects;
CREATE POLICY "Caretakers upload real avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  public.is_caretaker_of((storage.foldername(name))[1]::uuid)
);

-- 5. Allow users to upload their own avatars
DROP POLICY IF EXISTS "Users upload own avatars" ON storage.objects;
CREATE POLICY "Users upload own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Allow Updates (Overwrite)
DROP POLICY IF EXISTS "Caretakers update virtual avatars" ON storage.objects;
CREATE POLICY "Caretakers update virtual avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = 'virtual_elders' AND
  EXISTS (
    SELECT 1 FROM public.virtual_elders 
    WHERE id::text = (storage.foldername(name))[2] 
    AND caretaker_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Caretakers update real avatars" ON storage.objects;
CREATE POLICY "Caretakers update real avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  public.is_caretaker_of((storage.foldername(name))[1]::uuid)
);
