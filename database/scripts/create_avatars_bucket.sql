-- 1. Create the 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow Public View
DROP POLICY IF EXISTS "Public View" ON storage.objects;
CREATE POLICY "Public View" ON storage.objects 
FOR SELECT USING (bucket_id = 'avatars');

-- 3. Universal Upload Policy (Flat [UUID].jpg structure)
DROP POLICY IF EXISTS "Universal Avatar Upload" ON storage.objects;
CREATE POLICY "Universal Avatar Upload" ON storage.objects
FOR INSERT WITH CHECK (
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

-- 4. Universal Update Policy
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
