
DELETE FROM public.messages WHERE sender_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675';
DELETE FROM public.notifications WHERE profile_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675' OR related_profile_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675';
DELETE FROM public.conversation_ratings WHERE rater_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675' OR rated_profile_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675';
DELETE FROM public.conversations WHERE 'a3ceffde-9d0e-41f8-8203-d3905bdd5675' = ANY(participants);
DELETE FROM public.demandes WHERE from_profile_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675' OR to_profile_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675';
DELETE FROM public.trajets WHERE profile_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675';
DELETE FROM public.locations WHERE profile_id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675';
DELETE FROM public.profiles WHERE id = 'a3ceffde-9d0e-41f8-8203-d3905bdd5675';
DELETE FROM auth.users WHERE id = '4bbddc23-711a-401e-bb42-dc033de0263a';
