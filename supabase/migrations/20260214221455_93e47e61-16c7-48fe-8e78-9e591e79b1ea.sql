-- Force PostgREST to reload its schema cache after GRANT changes
NOTIFY pgrst, 'reload schema';