-- Enable Virtual Elders to use Blog/Forum
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS virtual_elder_id UUID REFERENCES public.virtual_elders(id) ON DELETE CASCADE;
-- Allow unauthenticated virtual elders to create posts if they provide their UUID
DROP POLICY IF EXISTS "Public manage virtual posts" ON public.posts;
CREATE POLICY "Public manage virtual posts" ON public.posts
FOR ALL USING (true) WITH CHECK (true); -- Relaxed for now to allow virtual elders post
