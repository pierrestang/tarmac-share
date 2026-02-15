-- Update email templates to French
-- Reset password email
UPDATE auth.mfa_factors SET id = id WHERE false; -- no-op to allow migration

-- We need to use the Supabase config for email templates
-- Email templates are configured via config.toml, not SQL
SELECT 1;
