-- Fix: Change demandes DELETE policy from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Users delete own demandes" ON public.demandes;

CREATE POLICY "Users delete own demandes"
ON public.demandes
FOR DELETE
TO authenticated
USING ((from_profile_id = get_my_profile_id()) OR (to_profile_id = get_my_profile_id()));