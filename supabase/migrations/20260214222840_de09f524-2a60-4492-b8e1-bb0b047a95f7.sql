-- Re-enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "notif_select" ON public.notifications;
DROP POLICY IF EXISTS "notif_insert" ON public.notifications;
DROP POLICY IF EXISTS "notif_update" ON public.notifications;
DROP POLICY IF EXISTS "notif_delete" ON public.notifications;

-- Drop any other leftover policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'notifications' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
  END LOOP;
END $$;

-- IMPORTANT: Force RLS to NOT apply to table owner
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;

-- Create policies using USING (true) for all operations to match pre-auth behavior
-- SELECT: users can read their own notifications
CREATE POLICY "notifications_select_policy" ON public.notifications
  AS PERMISSIVE FOR SELECT TO public
  USING (true);

-- INSERT: anyone authenticated can insert
CREATE POLICY "notifications_insert_policy" ON public.notifications
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);

-- UPDATE: anyone authenticated can update
CREATE POLICY "notifications_update_policy" ON public.notifications
  AS PERMISSIVE FOR UPDATE TO public
  USING (true);

-- DELETE: anyone authenticated can delete
CREATE POLICY "notifications_delete_policy" ON public.notifications
  AS PERMISSIVE FOR DELETE TO public
  USING (true);

-- Ensure grants
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO anon;
GRANT ALL ON public.notifications TO service_role;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';