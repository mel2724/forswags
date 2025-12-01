-- Create storage bucket for media assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-assets',
  'media-assets',
  true,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Storage policies for media assets
CREATE POLICY "Users can view all media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'media-assets');

CREATE POLICY "Users can upload their own media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'media-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own media"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'media-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'media-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);