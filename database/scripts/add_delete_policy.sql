-- Add DELETE policy for posts
CREATE POLICY "Authors can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);
