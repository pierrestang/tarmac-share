
-- Fix notifications INSERT policy: make it PERMISSIVE so users can create notifications for others
DROP POLICY IF EXISTS "Users insert notifications" ON public.notifications;

CREATE POLICY "Users insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);
