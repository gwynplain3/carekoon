/* 
  BROADCAST SYSTEM 
  Allows caretakers to send timed announcements to their elders.
*/

CREATE TABLE IF NOT EXISTS broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caretaker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

-- Allow caretakers to do everything with their own broadcasts
DROP POLICY IF EXISTS "Caretakers can manage their own broadcasts" ON broadcasts;
CREATE POLICY "Caretakers can manage their own broadcasts" ON broadcasts
    FOR ALL USING (auth.uid() = caretaker_id);

-- Allow elders to read active broadcasts
DROP POLICY IF EXISTS "Anyone can view active broadcasts" ON broadcasts;
CREATE POLICY "Anyone can view active broadcasts" ON broadcasts
    FOR SELECT USING (expires_at > NOW());
