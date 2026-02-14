-- Temporarily disable RLS on notifications to test
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Force PostgREST to pick up the change
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';