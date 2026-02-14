-- Nuclear reset: drop ALL notification policies
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users insert notifications" ON public.notifications;

-- Also drop any other possible policy names
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'notifications' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
  END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Re-grant permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications TO anon;

-- Create fresh PERMISSIVE policies
CREATE POLICY "notif_select" ON public.notifications
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (profile_id = get_my_profile_id());

CREATE POLICY "notif_insert" ON public.notifications
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "notif_update" ON public.notifications
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (profile_id = get_my_profile_id());

CREATE POLICY "notif_delete" ON public.notifications
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (profile_id = get_my_profile_id());

-- Add notifications to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';