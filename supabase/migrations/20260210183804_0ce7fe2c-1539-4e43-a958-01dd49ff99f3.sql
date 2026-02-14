
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
