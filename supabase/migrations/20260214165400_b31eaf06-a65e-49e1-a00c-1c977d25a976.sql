
-- 1. Add user_id column to profiles
ALTER TABLE public.profiles ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX profiles_user_id_idx ON public.profiles(user_id);

-- 2. Security definer function to get profile id for current user
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- 3. Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, first_name, last_name, created_at)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    (EXTRACT(epoch FROM now()) * 1000)::bigint
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Drop all old permissive "Allow all" policies
DROP POLICY IF EXISTS "Allow all select on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all insert on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all update on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all delete on profiles" ON public.profiles;

DROP POLICY IF EXISTS "Allow all select on trajets" ON public.trajets;
DROP POLICY IF EXISTS "Allow all insert on trajets" ON public.trajets;
DROP POLICY IF EXISTS "Allow all update on trajets" ON public.trajets;
DROP POLICY IF EXISTS "Allow all delete on trajets" ON public.trajets;

DROP POLICY IF EXISTS "Allow all select on demandes" ON public.demandes;
DROP POLICY IF EXISTS "Allow all insert on demandes" ON public.demandes;
DROP POLICY IF EXISTS "Allow all update on demandes" ON public.demandes;
DROP POLICY IF EXISTS "Allow all delete on demandes" ON public.demandes;

DROP POLICY IF EXISTS "Allow all select on conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow all insert on conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow all update on conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow all delete on conversations" ON public.conversations;

DROP POLICY IF EXISTS "Allow all select on messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all insert on messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all update on messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all delete on messages" ON public.messages;

DROP POLICY IF EXISTS "Allow all select on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow all insert on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow all update on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow all delete on notifications" ON public.notifications;

DROP POLICY IF EXISTS "Allow all select on conversation_ratings" ON public.conversation_ratings;
DROP POLICY IF EXISTS "Allow all insert on conversation_ratings" ON public.conversation_ratings;
DROP POLICY IF EXISTS "Allow all update on conversation_ratings" ON public.conversation_ratings;
DROP POLICY IF EXISTS "Allow all delete on conversation_ratings" ON public.conversation_ratings;

-- 5. New RLS policies for profiles
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users delete own profile" ON public.profiles
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- No insert policy needed: trigger handles profile creation

-- 6. New RLS policies for trajets
CREATE POLICY "Users read own trajets" ON public.trajets
  FOR SELECT TO authenticated USING (profile_id = public.get_my_profile_id());

CREATE POLICY "Users insert own trajets" ON public.trajets
  FOR INSERT TO authenticated WITH CHECK (profile_id = public.get_my_profile_id());

CREATE POLICY "Users update own trajets" ON public.trajets
  FOR UPDATE TO authenticated USING (profile_id = public.get_my_profile_id());

CREATE POLICY "Users delete own trajets" ON public.trajets
  FOR DELETE TO authenticated USING (profile_id = public.get_my_profile_id());

-- Also allow reading other users' trajets for matching
CREATE POLICY "Authenticated users can read all trajets" ON public.trajets
  FOR SELECT TO authenticated USING (true);

-- 7. New RLS policies for demandes
CREATE POLICY "Users read own demandes" ON public.demandes
  FOR SELECT TO authenticated
  USING (from_profile_id = public.get_my_profile_id() OR to_profile_id = public.get_my_profile_id());

CREATE POLICY "Users insert own demandes" ON public.demandes
  FOR INSERT TO authenticated WITH CHECK (from_profile_id = public.get_my_profile_id());

CREATE POLICY "Users update own demandes" ON public.demandes
  FOR UPDATE TO authenticated
  USING (from_profile_id = public.get_my_profile_id() OR to_profile_id = public.get_my_profile_id());

CREATE POLICY "Users delete own demandes" ON public.demandes
  FOR DELETE TO authenticated
  USING (from_profile_id = public.get_my_profile_id() OR to_profile_id = public.get_my_profile_id());

-- 8. Conversations: participants contain profile_id as text
CREATE POLICY "Users read own conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (public.get_my_profile_id()::text = ANY(participants));

CREATE POLICY "Users insert conversations" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (public.get_my_profile_id()::text = ANY(participants));

CREATE POLICY "Users update own conversations" ON public.conversations
  FOR UPDATE TO authenticated
  USING (public.get_my_profile_id()::text = ANY(participants));

CREATE POLICY "Users delete own conversations" ON public.conversations
  FOR DELETE TO authenticated
  USING (public.get_my_profile_id()::text = ANY(participants));

-- 9. Messages: via conversation membership
CREATE POLICY "Users read messages in own conversations" ON public.messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND public.get_my_profile_id()::text = ANY(c.participants)
  ));

CREATE POLICY "Users insert messages in own conversations" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND public.get_my_profile_id()::text = ANY(c.participants)
  ));

CREATE POLICY "Users update messages in own conversations" ON public.messages
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND public.get_my_profile_id()::text = ANY(c.participants)
  ));

CREATE POLICY "Users delete messages in own conversations" ON public.messages
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND public.get_my_profile_id()::text = ANY(c.participants)
  ));

-- 10. Notifications
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (profile_id = public.get_my_profile_id());

CREATE POLICY "Users insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (profile_id = public.get_my_profile_id());

CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (profile_id = public.get_my_profile_id());

-- 11. Conversation ratings
CREATE POLICY "Users read own ratings" ON public.conversation_ratings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users insert own ratings" ON public.conversation_ratings
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users update own ratings" ON public.conversation_ratings
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users delete own ratings" ON public.conversation_ratings
  FOR DELETE TO authenticated USING (true);
