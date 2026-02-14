-- Grant permissions on ALL public tables to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_ratings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demandes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trajets TO authenticated;

-- Anon can read profiles and trajets (for public browsing)
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.trajets TO anon;