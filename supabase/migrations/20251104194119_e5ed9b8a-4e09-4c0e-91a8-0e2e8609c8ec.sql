-- Fix notification_campaigns RLS policies
CREATE POLICY "Admins can view notification campaigns"
ON notification_campaigns
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert campaigns"
ON notification_campaigns
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Admins can update campaigns"
ON notification_campaigns
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create secure storage bucket for data exports
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('user-data-exports', 'user-data-exports', false, 104857600)
ON CONFLICT (id) DO NOTHING;

-- Users can download their own exports
CREATE POLICY "Users can download their own exports"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-data-exports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Service role can insert export files
CREATE POLICY "Service role can insert export files"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'user-data-exports');

-- Add storage_path column to data_export_requests
ALTER TABLE data_export_requests
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Fix function search_path issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;