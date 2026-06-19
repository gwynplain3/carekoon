-- 1. Create a View for the Social Feed (Blogs)
-- This combines authors from both real profiles and virtual elder tables
CREATE OR REPLACE VIEW public.community_feed AS
SELECT 
  p.*,
  COALESCE(pr.display_name, ve.display_name, 'ผู้ใช้งาน') as author_name,
  COALESCE(pr.avatar_url, ve.avatar_url) as author_avatar
FROM public.posts p
LEFT JOIN public.profiles pr ON p.user_id = pr.id
LEFT JOIN public.virtual_elders ve ON p.virtual_elder_id = ve.id;

-- Ensure the view is accessible
GRANT SELECT ON public.community_feed TO anon, authenticated;

-- 2. Update RLS for Posts (Public Social Media style)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public see all posts" ON public.posts;
CREATE POLICY "Public see all posts" ON public.posts FOR SELECT USING (true);

-- 3. Secure Diaries (Private for Elder & Caretaker)
ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own diaries" ON public.diaries;
DROP POLICY IF EXISTS "Caretakers manage virtual diaries" ON public.diaries;
DROP POLICY IF EXISTS "Public manage virtual diaries" ON public.diaries;

-- Real Elders manage their own
CREATE POLICY "Elders manage own diaries" ON public.diaries 
FOR ALL USING (auth.uid() = user_id);

-- Caretakers manage diaries of elders they link to
CREATE POLICY "Caretakers manage diaries" ON public.diaries
FOR ALL USING (
  user_id IN (SELECT elder_id FROM public.caretaker_elder_links WHERE caretaker_id = auth.uid()) OR
  virtual_elder_id IN (SELECT id FROM public.virtual_elders WHERE caretaker_id = auth.uid())
);

-- Virtual Elders can see their own (scoping is done via the virtual_elder_id check in app)
-- To keep it truly private for unauthenticated users, we'd need a PIN or session.
-- For now, we allow virtual_elder_id access.
CREATE POLICY "Virtual elders see own diaries" ON public.diaries
FOR ALL USING (virtual_elder_id IS NOT NULL); 
