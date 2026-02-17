
CREATE OR REPLACE FUNCTION public.get_matched_trajet_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT unnest(ARRAY[from_trajet_id, to_trajet_id])
  FROM public.demandes
  WHERE status IN ('accepted', 'completed');
$$;
