-- ENABLE REALTIME FOR ALL CRITICAL TABLES
-- This ensures Supabase sends data changes to our frontend instantly.

-- 1. Check if the publication 'supabase_realtime' exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- 2. Add tables to the publication
-- We use ALTER PUBLICATION because it's safer for existing ones.
ALTER PUBLICATION supabase_realtime ADD TABLE medicines;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE broadcasts;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE virtual_elders;
ALTER PUBLICATION supabase_realtime ADD TABLE water_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE meal_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE grocery_items;

-- 3. Ensure REPLICA IDENTITY is set to FULL for precise updates
ALTER TABLE medicines REPLICA IDENTITY FULL;
ALTER TABLE appointments REPLICA IDENTITY FULL;
ALTER TABLE alerts REPLICA IDENTITY FULL;
ALTER TABLE broadcasts REPLICA IDENTITY FULL;
ALTER TABLE water_logs REPLICA IDENTITY FULL;
ALTER TABLE meal_logs REPLICA IDENTITY FULL;
ALTER TABLE todos REPLICA IDENTITY FULL;
ALTER TABLE grocery_items REPLICA IDENTITY FULL;
