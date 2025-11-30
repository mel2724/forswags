-- Add team_logo_url column to athletes table
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS team_logo_url TEXT;

-- Create storage bucket for team logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-logos', 'team-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for team logos bucket
CREATE POLICY "Authenticated users can upload their team logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'team-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own team logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'team-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own team logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'team-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Team logos are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'team-logos');