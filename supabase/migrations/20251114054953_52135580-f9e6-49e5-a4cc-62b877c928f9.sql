-- Allow admins to upload videos to playbook-videos bucket
CREATE POLICY "Admins can upload playbook videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'playbook-videos' 
  AND (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ))
);

-- Allow admins to update playbook videos
CREATE POLICY "Admins can update playbook videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'playbook-videos'
  AND (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ))
);

-- Allow admins to delete playbook videos
CREATE POLICY "Admins can delete playbook videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'playbook-videos'
  AND (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ))
);

-- Allow anyone to view playbook videos (public bucket)
CREATE POLICY "Anyone can view playbook videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'playbook-videos');