-- Clear all diaries, forum posts, and comments
TRUNCATE TABLE public.diaries RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.comments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.posts RESTART IDENTITY CASCADE;
