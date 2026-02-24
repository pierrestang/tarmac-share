CREATE TABLE IF NOT EXISTS public.locations (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    updated_at BIGINT NOT NULL DEFAULT (EXTRACT(epoch FROM now()) * 1000)::bigint,
    is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own location
CREATE POLICY "Users can manage their own location"
ON public.locations
FOR ALL
USING (profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1))
WITH CHECK (profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));

-- Allow authenticated users to read locations (simple for now, can be restricted to matches later)
CREATE POLICY "Authenticated users can read locations"
ON public.locations
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Enable realtime for locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;