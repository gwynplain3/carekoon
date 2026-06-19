-- Allow Anonymous upload for Virtual Elders (they don't have a session)
-- This is necessary because Virtual Elders login via code and use localStorage, not Supabase Auth.
DROP POLICY IF EXISTS "Public Avatar Upload" ON storage.objects;
CREATE POLICY "Public Avatar Upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public Avatar Update" ON storage.objects;
CREATE POLICY "Public Avatar Update" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars');
