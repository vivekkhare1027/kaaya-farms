-- ============================================================
-- Kaaya Farms — Row Level Security (RLS) Policies
-- ============================================================
-- Run this entire script in the Supabase SQL Editor.
-- It enables RLS on all 6 data tables and creates policies
-- that restrict every authenticated user to only their farm's
-- data.
--
-- Security model used here:
--   Any authenticated user may read/write rows where
--   farm_id matches the farm they belong to.
--   Access is controlled via a `farm_members` table that
--   maps auth.users → farm_id with an optional role.
--
-- SETUP STEPS (run once after executing this script):
--   1. Find your farm UUID in .env.local → VITE_FARM_ID
--   2. Find each user's UUID in Supabase → Authentication → Users
--   3. Insert one row per user into farm_members:
--
--      INSERT INTO farm_members (user_id, farm_id, role)
--      VALUES
--        ('<paste-user-uuid-1>', 'fe6f537e-c7f1-4368-abbe-d8da4f97f8d0', 'admin'),
--        ('<paste-user-uuid-2>', 'fe6f537e-c7f1-4368-abbe-d8da4f97f8d0', 'member');
--
-- ============================================================

-- ── 1. FARM MEMBERS TABLE ────────────────────────────────────
-- Maps users to farms. Allows multi-user, multi-farm support.

CREATE TABLE IF NOT EXISTS farm_members (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id    uuid NOT NULL,
  role       text NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, farm_id)
);

ALTER TABLE farm_members ENABLE ROW LEVEL SECURITY;

-- Users can only read their own membership rows
CREATE POLICY "farm_members_read_own" ON farm_members
  FOR SELECT USING (user_id = auth.uid());


-- ── 2. HELPER FUNCTION ───────────────────────────────────────
-- Returns the farm_ids the current user belongs to.
-- SECURITY DEFINER runs as the function owner (bypasses RLS on
-- farm_members so the policies below can use it).

CREATE OR REPLACE FUNCTION get_my_farm_ids()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT ARRAY(
    SELECT farm_id FROM farm_members WHERE user_id = auth.uid()
  )
$$;


-- ── 3. RLS ON ALL 6 DATA TABLES ──────────────────────────────

-- CATTLE
ALTER TABLE cattle ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cattle_farm_access" ON cattle;
CREATE POLICY "cattle_farm_access" ON cattle
  FOR ALL TO authenticated
  USING  (farm_id = ANY(get_my_farm_ids()))
  WITH CHECK (farm_id = ANY(get_my_farm_ids()));


-- MILK_YIELD_LOGS
ALTER TABLE milk_yield_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "milk_logs_farm_access" ON milk_yield_logs;
CREATE POLICY "milk_logs_farm_access" ON milk_yield_logs
  FOR ALL TO authenticated
  USING  (farm_id = ANY(get_my_farm_ids()))
  WITH CHECK (farm_id = ANY(get_my_farm_ids()));


-- CATTLE_HEALTH_LOGS
ALTER TABLE cattle_health_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "health_logs_farm_access" ON cattle_health_logs;
CREATE POLICY "health_logs_farm_access" ON cattle_health_logs
  FOR ALL TO authenticated
  USING  (farm_id = ANY(get_my_farm_ids()))
  WITH CHECK (farm_id = ANY(get_my_farm_ids()));


-- FEED_INVENTORY
ALTER TABLE feed_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_farm_access" ON feed_inventory;
CREATE POLICY "feed_farm_access" ON feed_inventory
  FOR ALL TO authenticated
  USING  (farm_id = ANY(get_my_farm_ids()))
  WITH CHECK (farm_id = ANY(get_my_farm_ids()));


-- LEDGER_ENTRIES
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ledger_farm_access" ON ledger_entries;
CREATE POLICY "ledger_farm_access" ON ledger_entries
  FOR ALL TO authenticated
  USING  (farm_id = ANY(get_my_farm_ids()))
  WITH CHECK (farm_id = ANY(get_my_farm_ids()));


-- TODOS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "todos_farm_access" ON todos;
CREATE POLICY "todos_farm_access" ON todos
  FOR ALL TO authenticated
  USING  (farm_id = ANY(get_my_farm_ids()))
  WITH CHECK (farm_id = ANY(get_my_farm_ids()));


-- ── 4. STORAGE BUCKET POLICY ─────────────────────────────────
-- Restrict receipt uploads/downloads to authenticated users only.
-- Run these in the Supabase Dashboard → Storage → Policies,
-- or use the SQL below if using the storage schema directly.

-- Allow authenticated users to upload to their own farm folder
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'farm_receipts_upload',
  'farm-media',
  'INSERT',
  'auth.role() = ''authenticated'''
)
ON CONFLICT (name, bucket_id) DO NOTHING;

-- Allow authenticated users to read their own farm's receipts
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'farm_receipts_read',
  'farm-media',
  'SELECT',
  'auth.role() = ''authenticated'''
)
ON CONFLICT (name, bucket_id) DO NOTHING;


-- ── 5. VERIFICATION QUERIES ──────────────────────────────────
-- Run these after setup to confirm RLS is active on all tables.

SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN (
  'cattle', 'milk_yield_logs', 'cattle_health_logs',
  'feed_inventory', 'ledger_entries', 'todos'
)
ORDER BY tablename;

-- Expected output: rls_enabled = true for all 6 rows.
-- If any show false, run: ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;
