-- 1. Ensure columns exist (for robustness)
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS virtual_elder_id UUID REFERENCES public.virtual_elders(id) ON DELETE SET NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS virtual_elder_id UUID REFERENCES public.virtual_elders(id) ON DELETE CASCADE;

-- 2. Relax visibility for profiles and virtual_elders so names show up in views for everyone
-- This is essential for the LEFT JOIN in views to work for 'anon' or other users
DROP POLICY IF EXISTS "Public see basic profile info" ON public.profiles;
CREATE POLICY "Public see basic profile info" ON public.profiles 
FOR SELECT USING (true); -- Allow all to see display_name, avatar_url, role

DROP POLICY IF EXISTS "Public see virtual elder basic info" ON public.virtual_elders;
CREATE POLICY "Public see virtual elder basic info" ON public.virtual_elders
FOR SELECT USING (true); -- Allow all to see display_name, avatar_url

-- 3. Update Views with (Caretaker) suffix
CREATE OR REPLACE VIEW public.comment_feed AS
SELECT 
  c.*,
  COALESCE(
    CASE WHEN pr.role = 'caretaker' THEN pr.display_name || ' (Caretaker)' ELSE pr.display_name END,
    ve.display_name,
    'ผู้ใช้งาน'
  ) as author_name,
  COALESCE(pr.avatar_url, ve.avatar_url) as author_avatar
FROM public.comments c
LEFT JOIN public.profiles pr ON c.user_id = pr.id
LEFT JOIN public.virtual_elders ve ON c.virtual_elder_id = ve.id;

CREATE OR REPLACE VIEW public.community_feed AS
SELECT 
  p.*,
  COALESCE(
    CASE WHEN pr.role = 'caretaker' THEN pr.display_name || ' (Caretaker)' ELSE pr.display_name END,
    ve.display_name,
    'ผู้ใช้งาน'
  ) as author_name,
  COALESCE(pr.avatar_url, ve.avatar_url) as author_avatar
FROM public.posts p
LEFT JOIN public.profiles pr ON p.user_id = pr.id
LEFT JOIN public.virtual_elders ve ON p.virtual_elder_id = ve.id;

-- 4. Re-grant access
GRANT SELECT ON public.comment_feed TO anon, authenticated;
GRANT SELECT ON public.community_feed TO anon, authenticated;
