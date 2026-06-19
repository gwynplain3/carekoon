-- Updated SQL Script to clean up and reset elder-related data
-- This script fixes the naming errors (like medicine_logs) and clears unwanted tables/data

-- 1. DELETE all virtual elders (Caretakers will re-create them with chosen names)
DELETE FROM public.virtual_elders;

-- 2. DELETE all elder-role profiles 
-- (This removes email-registered elders so they can be re-linked with Caretaker-specified names)
DELETE FROM public.profiles WHERE role = 'elder';

-- 3. CLEAR ALL DATA tables linked to elders (Caretaker and Virtual)
-- Caretakers manage these, so we wipe them for a clean start
DELETE FROM public.medicines;
DELETE FROM public.water_logs;
DELETE FROM public.grocery_items;
DELETE FROM public.todos;
DELETE FROM public.health_logs;
DELETE FROM public.appointments;

-- 4. CLEAN UP INVITATION/LINK SYSTEM
-- Since we are resetting how elders are managed, we clear old links/pending invitations
DELETE FROM public.caretaker_elder_links;
DELETE FROM public.caretaker_invites;

-- 5. OPTIONAL: To delete unwanted or unused tables completely from the schema
-- Only run these if you are SURE you don't need these features anymore.
-- DROP TABLE IF EXISTS public.caretaker_invites CASCADE; -- Use this if you are moving away from invitations entirely
-- DROP TABLE IF EXISTS public.health_logs CASCADE; -- Use this if you don't want vitals tracking yet

-- 6. RESET IDENTITY SEQUENCES (Optional, for clean IDs starting from 1)
-- ALTER TABLE public.medicines RESTART IDENTITY;
-- ALTER TABLE public.water_logs RESTART IDENTITY;
-- ALTER TABLE public.grocery_items RESTART IDENTITY;
-- ALTER TABLE public.todos RESTART IDENTITY;
