
-- Allow anonymous uploads for registration
DROP POLICY IF EXISTS "Users can upload profile photos" ON storage.objects;
CREATE POLICY "Anyone can upload profile photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'profile-photos');
