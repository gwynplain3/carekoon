-- Simplified Storage Policies for Avatars bucket (Flat Structure)
-- 1. Ensure the bucket is definitely public
UPDATE storage.buckets SET public = true WHERE id = 'avatars';

-- 2. Allow Public View
DROP POLICY IF EXISTS "Public View" ON storage.objects;
CREATE POLICY "Public View" ON storage.objects 
FOR SELECT USING (bucket_id = 'avatars');

-- 3. Allow Caretakers and Users to upload/update images matching their elder IDs
-- Since the filename is now just [UUID].jpg, we check if the user is a caretaker of that UUID
-- or if the user IS that UUID.
DROP POLICY IF EXISTS "Universal Avatar Upload" ON storage.objects;
CREATE POLICY "Universal Avatar Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  (
    -- Is the filename equal to the user's own ID?
    (storage.filename(name)) = (auth.uid()::text || '.jpg')
    OR
    -- Is the user a caretaker of the ID in the filename?
    public.is_caretaker_of(REPLACE(storage.filename(name), '.jpg', '')::uuid)
    OR
    -- Is it a virtual elder owned by the caretaker?
    EXISTS (
      SELECT 1 FROM public.virtual_elders 
      WHERE id::text = REPLACE(storage.filename(name), '.jpg', '')
      AND caretaker_id = auth.uid()
    )
  )
);

-- 4. Allow Overwrite (Update)
DROP POLICY IF EXISTS "Universal Avatar Update" ON storage.objects;
CREATE POLICY "Universal Avatar Update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  (
    (storage.filename(name)) = (auth.uid()::text || '.jpg')
    OR
    public.is_caretaker_of(REPLACE(storage.filename(name), '.jpg', '')::uuid)
    OR
    EXISTS (
      SELECT 1 FROM public.virtual_elders 
      WHERE id::text = REPLACE(storage.filename(name), '.jpg', '')
      AND caretaker_id = auth.uid()
    )
  )
);
