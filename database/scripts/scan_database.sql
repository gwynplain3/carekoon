-- 1. List all public tables and their column counts
SELECT 
    t.table_name,
    (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as column_count,
    pg_size_pretty(pg_total_relation_size('"' || t.table_name || '"')) as total_size
FROM information_schema.tables t
WHERE t.table_schema = 'public'
ORDER BY t.table_name;

-- 2. Check for unused legacy tables (Common patterns from previous sessions)
-- Potential candidates for deletion if they exist:
--   messages (replaced by diaries)
--   chats (old)
--   elder_connections (replaced by caretaker_elder_links)
--   inventory (old)
