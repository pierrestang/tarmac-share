
-- Drop all RESTRICTIVE policies on notifications
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users insert notifications" ON public.notifications;

-- Recreate as PERMISSIVE
CREATE POLICY "Users read own notifications" ON public.notifications
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (profile_id = get_my_profile_id());

CREATE POLICY "Users update own notifications" ON public.notifications
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (profile_id = get_my_profile_id());

CREATE POLICY "Users delete own notifications" ON public.notifications
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (profile_id = get_my_profile_id());

CREATE POLICY "Users insert notifications" ON public.notifications
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (true);
