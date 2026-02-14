-- Allow authenticated users to read all profiles (needed for matches display)
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;

CREATE POLICY "Authenticated users can read all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);