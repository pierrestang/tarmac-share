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