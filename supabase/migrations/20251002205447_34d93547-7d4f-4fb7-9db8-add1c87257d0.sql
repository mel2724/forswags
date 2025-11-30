-- Create archived_media table for tracking all media versions and deletions
CREATE TABLE IF NOT EXISTS archived_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_media_id uuid NOT NULL,
  user_id uuid NOT NULL,
  athlete_id uuid,
  media_type text NOT NULL,
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  content_type text,
  version_number integer NOT NULL DEFAULT 1,
  archived_reason text NOT NULL,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean DEFAULT false,
  replaced_by_media_id uuid,
  CONSTRAINT fk_original_media FOREIGN KEY (original_media_id) REFERENCES media_assets(id) ON DELETE CASCADE
);

-- Enable RLS on archived_media
ALTER TABLE archived_media ENABLE ROW LEVEL SECURITY;

-- Only admins can view archived media
CREATE POLICY "Admins can view all archived media"
ON archived_media FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- System can insert archived media
CREATE POLICY "System can insert archived media"
ON archived_media FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_archived_media_user_id ON archived_media(user_id);
CREATE INDEX idx_archived_media_athlete_id ON archived_media(athlete_id);
CREATE INDEX idx_archived_media_original_id ON archived_media(original_media_id);
CREATE INDEX idx_archived_media_archived_at ON archived_media(archived_at);

-- Add versioning to media_assets
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS version_number integer DEFAULT 1;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

-- Function to archive media file (called before update or delete)
CREATE OR REPLACE FUNCTION public.archive_media_file()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Archive the old version before update
  IF TG_OP = 'UPDATE' AND (OLD.url != NEW.url OR OLD.is_archived = false AND NEW.is_archived = true) THEN
    INSERT INTO archived_media (
      original_media_id,
      user_id,
      athlete_id,
      media_type,
      storage_bucket,
      storage_path,
      file_name,
      file_size,
      content_type,
      version_number,
      archived_reason,
      metadata,
      is_deleted,
      replaced_by_media_id
    ) VALUES (
      OLD.id,
      OLD.user_id,
      OLD.athlete_id,
      OLD.media_type,
      CASE 
        WHEN OLD.media_type IN ('video', 'highlight') THEN 'media-assets'
        WHEN OLD.media_type = 'profile_picture' THEN 'profile-pictures'
        ELSE 'media-assets'
      END,
      OLD.url,
      OLD.title,
      OLD.file_size,
      OLD.media_type,
      OLD.version_number,
      CASE 
        WHEN NEW.is_archived THEN 'account_archived'
        ELSE 'media_updated'
      END,
      jsonb_build_object(
        'description', OLD.description,
        'thumbnail_url', OLD.thumbnail_url,
        'updated_at', OLD.updated_at
      ),
      NEW.is_archived,
      NEW.id
    );
    
    -- Increment version number on update
    NEW.version_number := OLD.version_number + 1;
  END IF;
  
  -- Archive before deletion
  IF TG_OP = 'DELETE' THEN
    INSERT INTO archived_media (
      original_media_id,
      user_id,
      athlete_id,
      media_type,
      storage_bucket,
      storage_path,
      file_name,
      file_size,
      content_type,
      version_number,
      archived_reason,
      metadata,
      is_deleted
    ) VALUES (
      OLD.id,
      OLD.user_id,
      OLD.athlete_id,
      OLD.media_type,
      CASE 
        WHEN OLD.media_type IN ('video', 'highlight') THEN 'media-assets'
        WHEN OLD.media_type = 'profile_picture' THEN 'profile-pictures'
        ELSE 'media-assets'
      END,
      OLD.url,
      OLD.title,
      OLD.file_size,
      OLD.media_type,
      OLD.version_number,
      'media_deleted',
      jsonb_build_object(
        'description', OLD.description,
        'thumbnail_url', OLD.thumbnail_url,
        'updated_at', OLD.updated_at
      ),
      true
    );
    
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for media archival
DROP TRIGGER IF EXISTS trigger_archive_media ON media_assets;
CREATE TRIGGER trigger_archive_media
  BEFORE UPDATE OR DELETE ON media_assets
  FOR EACH ROW
  EXECUTE FUNCTION archive_media_file();

-- Update archive_user_data function to include media archival
CREATE OR REPLACE FUNCTION public.archive_user_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership_id uuid;
  v_archived_data jsonb;
BEGIN
  -- Get current membership
  SELECT id INTO v_membership_id
  FROM memberships
  WHERE user_id = p_user_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_membership_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Mark all user's media as archived (triggers archive_media_file)
  UPDATE media_assets
  SET is_archived = true, archived_at = now()
  WHERE user_id = p_user_id AND is_archived = false;
  
  -- Archive college matches, analytics data, etc.
  v_archived_data := jsonb_build_object(
    'archived_at', now(),
    'restore_until', now() + interval '6 months',
    'college_matches', (
      SELECT jsonb_agg(row_to_json(cm))
      FROM college_matches cm
      JOIN athletes a ON a.id = cm.athlete_id
      WHERE a.user_id = p_user_id
    ),
    'profile_views', (
      SELECT jsonb_agg(row_to_json(pv))
      FROM profile_views pv
      JOIN athletes a ON a.id = pv.athlete_id
      WHERE a.user_id = p_user_id
    ),
    'media_count', (
      SELECT COUNT(*)
      FROM archived_media
      WHERE user_id = p_user_id
    )
  );
  
  -- Update membership with archived data
  UPDATE memberships
  SET 
    archived_data = v_archived_data,
    downgraded_at = now()
  WHERE id = v_membership_id;
END;
$$;

-- Function for admins to retrieve archived media
CREATE OR REPLACE FUNCTION public.admin_get_archived_media(
  p_user_id uuid DEFAULT NULL,
  p_athlete_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  original_media_id uuid,
  user_id uuid,
  athlete_id uuid,
  media_type text,
  storage_path text,
  file_name text,
  version_number integer,
  archived_reason text,
  archived_at timestamp with time zone,
  is_deleted boolean,
  user_email text,
  athlete_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can execute this
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  RETURN QUERY
  SELECT 
    am.id,
    am.original_media_id,
    am.user_id,
    am.athlete_id,
    am.media_type,
    am.storage_path,
    am.file_name,
    am.version_number,
    am.archived_reason,
    am.archived_at,
    am.is_deleted,
    p.email as user_email,
    p.full_name as athlete_name
  FROM archived_media am
  LEFT JOIN profiles p ON p.id = am.user_id
  WHERE 
    (p_user_id IS NULL OR am.user_id = p_user_id)
    AND (p_athlete_id IS NULL OR am.athlete_id = p_athlete_id)
  ORDER BY am.archived_at DESC
  LIMIT p_limit;
END;
$$;

-- Function to get media version history
CREATE OR REPLACE FUNCTION public.get_media_version_history(p_media_id uuid)
RETURNS TABLE (
  version_number integer,
  storage_path text,
  archived_at timestamp with time zone,
  archived_reason text,
  file_size integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins and media owners can view history
  IF NOT (
    has_role(auth.uid(), 'admin') 
    OR EXISTS (
      SELECT 1 FROM media_assets 
      WHERE id = p_media_id AND user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN QUERY
  SELECT 
    am.version_number,
    am.storage_path,
    am.archived_at,
    am.archived_reason,
    am.file_size
  FROM archived_media am
  WHERE am.original_media_id = p_media_id
  ORDER BY am.version_number DESC;
END;
$$;

-- Update storage bucket policies for archived content
-- Ensure buckets exist and are configured properly
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('archived-media', 'archived-media', false, 524288000, ARRAY['video/*', 'image/*'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for archived-media bucket
DROP POLICY IF EXISTS "Admins can view archived media" ON storage.objects;
CREATE POLICY "Admins can view archived media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'archived-media' 
  AND has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "System can upload to archived-media" ON storage.objects;
CREATE POLICY "System can upload to archived-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'archived-media');

-- Prevent deletion from archived-media bucket
DROP POLICY IF EXISTS "Prevent deletion of archived media" ON storage.objects;
CREATE POLICY "Prevent deletion of archived media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'archived-media' 
  AND has_role(auth.uid(), 'admin')
  AND false -- Effectively prevents all deletions unless explicitly overridden
);

-- Function to handle alumni account archival
CREATE OR REPLACE FUNCTION public.archive_alumni_account(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_media_count integer;
  v_alumni_id uuid;
BEGIN
  -- Get alumni profile
  SELECT id INTO v_alumni_id
  FROM alumni
  WHERE user_id = p_user_id;
  
  IF v_alumni_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Alumni profile not found');
  END IF;
  
  -- Archive all user data
  PERFORM archive_user_data(p_user_id);
  
  -- Count archived media
  SELECT COUNT(*) INTO v_media_count
  FROM archived_media
  WHERE user_id = p_user_id;
  
  -- Mark alumni as inactive but keep data
  UPDATE alumni
  SET 
    available_for_calls = false,
    willing_to_mentor = false,
    bio = COALESCE(bio, '') || ' [ACCOUNT ARCHIVED]'
  WHERE id = v_alumni_id;
  
  v_result := jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'alumni_id', v_alumni_id,
    'archived_media_count', v_media_count,
    'archived_at', now()
  );
  
  RETURN v_result;
END;
$$;