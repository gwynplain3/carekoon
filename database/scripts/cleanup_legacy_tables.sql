-- Cleanup Unused Legacy Tables
-- (These tables were replaced by newer systems in recent updates)

DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.elder_connections CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;

-- Cleanup orphaned Storage files (optional but good for hygiene)
-- Note: Manually check storage bucket 'avatars' for old files if needed.

-- Refresh RLS for target tables just to be sure everything is clean
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_elders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
