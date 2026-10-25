-- =====================================================================
-- Tarmac Share : schéma complet pour un projet Supabase neuf
-- Généré depuis supabase/migrations (26 fichiers, dans l'ordre horodaté).
-- À coller en une fois dans Supabase > SQL Editor > Run.
--
-- Ajustements par rapport aux migrations d'origine (marqués [ADAPTÉ]) :
--  - ajouts à la publication supabase_realtime rendus idempotents
--    (notifications y était ajoutée deux fois -> erreur sur base neuve) ;
--  - DELETE de comptes/données de l'ancienne base retirés (sans objet ici) ;
--  - no-op sur auth.mfa_factors retiré (peut être refusé par les droits) ;
--  - désactivation temporaire du RLS sur notifications retirée (aussitôt
--    réactivé dans la migration suivante).
-- =====================================================================

-- Ajoute une table à la publication realtime si elle n'y est pas déjà.
CREATE OR REPLACE FUNCTION pg_temp.add_to_realtime(tbl regclass)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    WHERE p.pubname = 'supabase_realtime' AND pr.prrelid = tbl
  ) THEN
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %s', tbl);
  END IF;
END $$;


-- ---------------------------------------------------------------------
-- 20260210183804_0ce7fe2c-1539-4e43-a958-01dd49ff99f3.sql
-- ---------------------------------------------------------------------

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  photo TEXT,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow all insert on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on profiles" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on profiles" ON public.profiles FOR DELETE USING (true);

-- Trajets table
CREATE TABLE public.trajets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  departure_station TEXT NOT NULL,
  departure_station_lat DOUBLE PRECISION,
  departure_station_lng DOUBLE PRECISION,
  departure_time TEXT NOT NULL,
  destination TEXT NOT NULL,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  companions INT NOT NULL DEFAULT 0,
  baggage_small INT NOT NULL DEFAULT 0,
  baggage_medium INT NOT NULL DEFAULT 0,
  baggage_large INT NOT NULL DEFAULT 0,
  desired_departure TEXT NOT NULL DEFAULT '',
  additional_info TEXT NOT NULL DEFAULT '',
  is_republished BOOLEAN NOT NULL DEFAULT false,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE public.trajets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select on trajets" ON public.trajets FOR SELECT USING (true);
CREATE POLICY "Allow all insert on trajets" ON public.trajets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on trajets" ON public.trajets FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on trajets" ON public.trajets FOR DELETE USING (true);

-- Demandes table
CREATE TABLE public.demandes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  from_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_trajet_id UUID NOT NULL REFERENCES public.trajets(id) ON DELETE CASCADE,
  to_trajet_id UUID NOT NULL REFERENCES public.trajets(id) ON DELETE CASCADE,
  snapshot JSONB,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE public.demandes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select on demandes" ON public.demandes FOR SELECT USING (true);
CREATE POLICY "Allow all insert on demandes" ON public.demandes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on demandes" ON public.demandes FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on demandes" ON public.demandes FOR DELETE USING (true);

-- Conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id TEXT NOT NULL,
  participants TEXT[] NOT NULL DEFAULT '{}',
  closed_by TEXT[] NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select on conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Allow all insert on conversations" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on conversations" ON public.conversations FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on conversations" ON public.conversations FOR DELETE USING (true);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'user',
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select on messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow all insert on messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on messages" ON public.messages FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on messages" ON public.messages FOR DELETE USING (true);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  demande_id TEXT NOT NULL,
  related_profile_id TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select on notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow all insert on notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on notifications" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on notifications" ON public.notifications FOR DELETE USING (true);

-- Conversation ratings table
CREATE TABLE public.conversation_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  rater_id TEXT NOT NULL,
  rated_profile_id TEXT NOT NULL,
  score INT NOT NULL,
  was_useful BOOLEAN NOT NULL DEFAULT false,
  comment TEXT NOT NULL DEFAULT '',
  UNIQUE(conversation_id, rater_id)
);

ALTER TABLE public.conversation_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select on conversation_ratings" ON public.conversation_ratings FOR SELECT USING (true);
CREATE POLICY "Allow all insert on conversation_ratings" ON public.conversation_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on conversation_ratings" ON public.conversation_ratings FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on conversation_ratings" ON public.conversation_ratings FOR DELETE USING (true);


-- ---------------------------------------------------------------------
-- 20260211154423_b67bce24-15f2-4d53-891d-da727614beb5.sql
-- ---------------------------------------------------------------------
SELECT pg_temp.add_to_realtime('public.notifications'); -- [ADAPTÉ]

-- ---------------------------------------------------------------------
-- 20260214165400_b31eaf06-a65e-49e1-a00c-1c977d25a976.sql
-- ---------------------------------------------------------------------

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


-- ---------------------------------------------------------------------
-- 20260214170058_f37762ed-64fc-49c7-98d6-669ed6c2a24d.sql
-- ---------------------------------------------------------------------
-- [ADAPTÉ] retiré (nettoyage de l'ancienne base) : DELETE FROM auth.users;

-- ---------------------------------------------------------------------
-- 20260214174815_3335cc46-a5f3-4898-b0a9-48507ef6955a.sql
-- ---------------------------------------------------------------------
-- Allow authenticated users to read all profiles (needed for matches display)
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;

CREATE POLICY "Authenticated users can read all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------------------
-- 20260214180107_a84cb782-f227-48c1-b332-e4338a2fad86.sql
-- ---------------------------------------------------------------------
-- Fix: Change demandes DELETE policy from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Users delete own demandes" ON public.demandes;

CREATE POLICY "Users delete own demandes"
ON public.demandes
FOR DELETE
TO authenticated
USING ((from_profile_id = get_my_profile_id()) OR (to_profile_id = get_my_profile_id()));

-- ---------------------------------------------------------------------
-- 20260214180734_881311f3-325a-4fce-9f58-d7b039536a79.sql
-- ---------------------------------------------------------------------

-- Add unique index to prevent duplicate pending demandes
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_demande 
ON public.demandes (from_profile_id, to_profile_id, from_trajet_id, to_trajet_id) 
WHERE status = 'pending';


-- ---------------------------------------------------------------------
-- 20260214181631_b37c6d5b-2d98-4fc6-8f2d-890ea446958b.sql
-- ---------------------------------------------------------------------

-- Fix notifications INSERT policy: make it PERMISSIVE so users can create notifications for others
DROP POLICY IF EXISTS "Users insert notifications" ON public.notifications;

CREATE POLICY "Users insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);


-- ---------------------------------------------------------------------
-- 20260214182612_1d71ff78-fe4a-473a-a233-649dd554802d.sql
-- ---------------------------------------------------------------------

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


-- ---------------------------------------------------------------------
-- 20260214221056_74a7d02d-9b8d-4937-ba74-20a10c040b94.sql
-- ---------------------------------------------------------------------
-- Grant table permissions to authenticated and anon roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications TO anon;

-- ---------------------------------------------------------------------
-- 20260214221143_1fc12c2e-8c49-4105-b461-a4d36b27e625.sql
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 20260214221455_93e47e61-16c7-48fe-8e78-9e591e79b1ea.sql
-- ---------------------------------------------------------------------
-- Force PostgREST to reload its schema cache after GRANT changes
NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- 20260214221901_dd59aacb-afc6-488d-a032-e21a1740f152.sql
-- ---------------------------------------------------------------------
-- Nuclear reset: drop ALL notification policies
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users insert notifications" ON public.notifications;

-- Also drop any other possible policy names
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'notifications' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
  END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Re-grant permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications TO anon;

-- Create fresh PERMISSIVE policies
CREATE POLICY "notif_select" ON public.notifications
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (profile_id = get_my_profile_id());

CREATE POLICY "notif_insert" ON public.notifications
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "notif_update" ON public.notifications
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (profile_id = get_my_profile_id());

CREATE POLICY "notif_delete" ON public.notifications
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (profile_id = get_my_profile_id());

-- Add notifications to realtime publication
SELECT pg_temp.add_to_realtime('public.notifications'); -- [ADAPTÉ]

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- 20260214222645_c65fc4db-0205-4932-a0a5-d52249cbcc2c.sql
-- ---------------------------------------------------------------------
-- Temporarily disable RLS on notifications to test
-- [ADAPTÉ] retiré (RLS réactivé juste après) : ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Force PostgREST to pick up the change
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ---------------------------------------------------------------------
-- 20260214222840_de09f524-2a60-4492-b8e1-bb0b047a95f7.sql
-- ---------------------------------------------------------------------
-- Re-enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "notif_select" ON public.notifications;
DROP POLICY IF EXISTS "notif_insert" ON public.notifications;
DROP POLICY IF EXISTS "notif_update" ON public.notifications;
DROP POLICY IF EXISTS "notif_delete" ON public.notifications;

-- Drop any other leftover policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'notifications' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
  END LOOP;
END $$;

-- IMPORTANT: Force RLS to NOT apply to table owner
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;

-- Create policies using USING (true) for all operations to match pre-auth behavior
-- SELECT: users can read their own notifications
CREATE POLICY "notifications_select_policy" ON public.notifications
  AS PERMISSIVE FOR SELECT TO public
  USING (true);

-- INSERT: anyone authenticated can insert
CREATE POLICY "notifications_insert_policy" ON public.notifications
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);

-- UPDATE: anyone authenticated can update
CREATE POLICY "notifications_update_policy" ON public.notifications
  AS PERMISSIVE FOR UPDATE TO public
  USING (true);

-- DELETE: anyone authenticated can delete
CREATE POLICY "notifications_delete_policy" ON public.notifications
  AS PERMISSIVE FOR DELETE TO public
  USING (true);

-- Ensure grants
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO anon;
GRANT ALL ON public.notifications TO service_role;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ---------------------------------------------------------------------
-- 20260215140353_459e7ad4-bc3b-44b6-8272-f45e4a6547cb.sql
-- ---------------------------------------------------------------------
-- Update email templates to French
-- Reset password email
-- [ADAPTÉ] retiré : UPDATE auth.mfa_factors SET id = id WHERE false; -- no-op to allow migration

-- We need to use the Supabase config for email templates
-- Email templates are configured via config.toml, not SQL
SELECT 1;


-- ---------------------------------------------------------------------
-- 20260217132313_69784374-1e79-414d-ba82-588f0cc1aca9.sql
-- ---------------------------------------------------------------------
ALTER TABLE public.demandes ADD COLUMN was_cancelled boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------
-- 20260217165357_76b3cd4f-57a8-4c72-bd6e-2aa66b1cf204.sql
-- ---------------------------------------------------------------------
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value boolean NOT NULL DEFAULT false
);

INSERT INTO public.app_settings (key, value) VALUES ('free_mode', true);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
  ON public.app_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can update settings"
  ON public.app_settings FOR UPDATE
  USING (auth.email() = 'pierres-19@hotmail.fr');

-- ---------------------------------------------------------------------
-- 20260217190437_1b748e93-88de-4c40-886c-2a1ad31b50f6.sql
-- ---------------------------------------------------------------------

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


-- ---------------------------------------------------------------------
-- 20260217192136_0b56b239-932d-4ff9-b9e4-30dd71a781f7.sql
-- ---------------------------------------------------------------------

SELECT pg_temp.add_to_realtime('public.messages'); -- [ADAPTÉ]
SELECT pg_temp.add_to_realtime('public.conversations'); -- [ADAPTÉ]
SELECT pg_temp.add_to_realtime('public.demandes'); -- [ADAPTÉ]
SELECT pg_temp.add_to_realtime('public.trajets'); -- [ADAPTÉ]


-- ---------------------------------------------------------------------
-- 20260224141950_e96b1e4d-edef-458a-95b8-7dbafe3d7be8.sql
-- ---------------------------------------------------------------------
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
SELECT pg_temp.add_to_realtime('public.locations'); -- [ADAPTÉ]

-- ---------------------------------------------------------------------
-- 20260311170427_790cf0d7-5f60-4ef2-a432-e3981cdffc39.sql
-- ---------------------------------------------------------------------
-- [ADAPTÉ] retiré (nettoyage de l'ancienne base) : DELETE FROM auth.users WHERE id = '46071fd3-31fd-44c2-8ba1-bbfd70bcb7e6';

-- ---------------------------------------------------------------------
-- 20260312164817_72b34322-a938-464b-ad28-9756a60928dc.sql
-- ---------------------------------------------------------------------

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Allow public read access
CREATE POLICY "Public read access for profile photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Allow users to update their own photos
CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');


-- ---------------------------------------------------------------------
-- 20260312164838_3da841d0-4e1d-40db-bd71-e79db9993b72.sql
-- ---------------------------------------------------------------------

-- Allow anonymous uploads for registration
DROP POLICY IF EXISTS "Users can upload profile photos" ON storage.objects;
CREATE POLICY "Anyone can upload profile photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'profile-photos');


-- ---------------------------------------------------------------------
-- 20260312164901_ef73b57e-76bd-46cd-969b-2d66ea9d25f9.sql
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, first_name, last_name, photo, created_at)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.raw_user_meta_data->>'photo',
    (EXTRACT(epoch FROM now()) * 1000)::bigint
  );
  RETURN NEW;
END;
$$;


-- ---------------------------------------------------------------------
-- 20260313130004_668ae03d-cc6d-4240-bccc-d5238dd790fc.sql
-- ---------------------------------------------------------------------

-- [ADAPTÉ] retiré (nettoyage de l'ancienne base) : DELETE FROM public.messages WHERE sender_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675';
-- [ADAPTÉ] retiré (nettoyage de l'ancienne base) : DELETE FROM public.notifications WHERE profile_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675' OR related_profile_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675';
-- [ADAPTÉ] retiré (nettoyage de l'ancienne base) : DELETE FROM public.conversation_ratings WHERE rater_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675' OR rated_profile_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675';
-- [ADAPTÉ] retiré (nettoyage de l'ancienne base) : DELETE FROM public.conversations WHERE 'a3ceffde-9d0e-41f8-8203-d3905bdd5675' = ANY(participants);
-- [ADAPTÉ] retiré (nettoyage de l'ancienne base) : DELETE FROM public.demandes WHERE from_profile_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675' OR to_profile_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675';
-- [ADAPTÉ] retiré (nettoyage de l'ancienne base) : DELETE FROM public.trajets WHERE profile_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675';
-- [ADAPTÉ] retiré (nettoyage de l'ancienne base) : DELETE FROM public.locations WHERE profile_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675';
-- [ADAPTÉ] retiré (nettoyage de l'ancienne base) : DELETE FROM public.profiles WHERE id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675';
-- [ADAPTÉ] retiré (nettoyage de l'ancienne base) : DELETE FROM auth.users WHERE id = '4bbddc23-711a-401e-bb42-dc033de0263a';

