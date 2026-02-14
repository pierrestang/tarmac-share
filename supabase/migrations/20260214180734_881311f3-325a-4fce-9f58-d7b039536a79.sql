
-- Add unique index to prevent duplicate pending demandes
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_demande 
ON public.demandes (from_profile_id, to_profile_id, from_trajet_id, to_trajet_id) 
WHERE status = 'pending';
