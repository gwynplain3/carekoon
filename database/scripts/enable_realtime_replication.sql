-- ROBUST REALTIME ENABLER
-- This script safely enables Realtime for all tables by resetting the publication list.

-- 1. Ensure the publication exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- 2. RESET the publication to include ONLY these tables
-- This is the safest way to avoid "already a member" errors
ALTER PUBLICATION supabase_realtime SET TABLE 
    medicines, 
    appointments, 
    alerts, 
    broadcasts, 
    profiles, 
    virtual_elders,
    water_logs,
    meal_logs,
    todos,
    grocery_items;

-- 3. Ensure REPLICA IDENTITY is set to FULL for precise updates
-- This allows Supabase to track exactly which row changed 
ALTER TABLE medicines REPLICA IDENTITY FULL;
ALTER TABLE appointments REPLICA IDENTITY FULL;
ALTER TABLE alerts REPLICA IDENTITY FULL;
ALTER TABLE broadcasts REPLICA IDENTITY FULL;
ALTER TABLE water_logs REPLICA IDENTITY FULL;
ALTER TABLE meal_logs REPLICA IDENTITY FULL;
ALTER TABLE todos REPLICA IDENTITY FULL;
ALTER TABLE grocery_items REPLICA IDENTITY FULL;
