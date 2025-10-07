-- ============================================================================
-- SECURITY FIXES: Address Critical RLS and Storage Issues
-- ============================================================================

-- 1. FIX OVERLY PERMISSIVE ATHLETES RLS POLICY
-- ============================================================================
-- Remove the dangerous 'SELECT USING (true)' policy that exposes all athlete data

DROP POLICY IF EXISTS "Anyone can view published athlete profiles" ON athletes;

-- Replace with restrictive, consent-based policies

-- Public can only view consenting ADULT athletes (no minors without verification)
CREATE POLICY "Public can view consenting adult athletes" ON athletes
FOR SELECT USING (
  visibility = 'public'
  AND public_profile_consent = true
  AND is_minor(date_of_birth) = false
);

-- Paid recruiters can view verified minor athletes (with proper consent)
CREATE POLICY "Paid recruiters can view verified minor athletes" ON athletes
FOR SELECT USING (
  is_paid_recruiter(auth.uid())
  AND visibility = 'public'
  AND public_profile_consent = true
  AND is_parent_verified = true
);

-- 2. FIX STORAGE BUCKET ACCESS CONTROL
-- ============================================================================

-- 2A. Profile Pictures - Add consent-aware access control
DROP POLICY IF EXISTS "Public can view profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;

CREATE POLICY "Users can view consenting profile pictures" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profile-pictures'
  AND (
    -- Own files
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Public profiles with consent (check via athletes table)
    EXISTS (
      SELECT 1 FROM athletes a
      WHERE a.user_id::text = (storage.foldername(name))[1]
        AND a.visibility = 'public'
        AND a.public_profile_consent = true
        AND (is_minor(a.date_of_birth) = false OR a.is_parent_verified = true)
    )
  )
);

-- 2B. Media Assets - Tie to athlete consent
DROP POLICY IF EXISTS "Anyone can view media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view media assets" ON storage.objects;

CREATE POLICY "Consented media viewable" ON storage.objects
FOR SELECT USING (
  bucket_id = 'media-assets'
  AND (
    -- Own media
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Media from consenting athletes
    EXISTS (
      SELECT 1 FROM media_assets m
      JOIN athletes a ON a.id = m.athlete_id
      WHERE m.url LIKE '%' || name || '%'
        AND a.public_profile_consent = true
        AND (is_minor(a.date_of_birth) = false OR a.is_parent_verified = true)
    )
  )
);

-- 2C. Offer Documents - Add admin access policy
CREATE POLICY "Admins can manage offer documents" ON storage.objects
FOR ALL USING (
  bucket_id = 'offer-documents'
  AND has_role(auth.uid(), 'admin')
);

-- 3. SERVER-SIDE FILE UPLOAD VALIDATION
-- ============================================================================

-- 3A. Create rate limiting function for profile uploads
CREATE OR REPLACE FUNCTION check_profile_upload_rate_limit()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  upload_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO upload_count
  FROM storage.objects
  WHERE owner = auth.uid()
    AND created_at > NOW() - INTERVAL '1 day'
    AND bucket_id = 'profile-pictures';
  
  RETURN upload_count < 10;  -- Max 10 uploads per day
END;
$$;

-- 3B. Enforce file size limits on profile pictures
CREATE POLICY "Profile pictures size limit" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-pictures'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (COALESCE((metadata->>'size')::bigint, 0)) <= 5242880  -- 5MB limit
);

-- 3C. Enforce allowed file extensions for profile pictures
CREATE POLICY "Profile pictures must be images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-pictures'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND storage.extension(name) = ANY(ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp'])
);

-- 3D. Add rate limiting policy for profile uploads
CREATE POLICY "Profile pictures rate limit" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-pictures'
  AND check_profile_upload_rate_limit()
);

-- 3E. Enforce file size limits on media assets
CREATE POLICY "Media assets size limit" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media-assets'
  AND (COALESCE((metadata->>'size')::bigint, 0)) <= 52428800  -- 50MB limit
);

-- 4. AUDIT LOGGING FOR SENSITIVE STORAGE ACCESS
-- ============================================================================

-- Create function to log offer document access
CREATE OR REPLACE FUNCTION log_offer_document_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log document operations to audit log
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, resource_type, metadata)
    VALUES (
      auth.uid(),
      'offer_document_delete',
      'storage_object',
      jsonb_build_object(
        'bucket', OLD.bucket_id,
        'name', OLD.name,
        'operation', 'DELETE'
      )
    );
    RETURN OLD;
  ELSE
    INSERT INTO audit_logs (user_id, action, resource_type, metadata)
    VALUES (
      auth.uid(),
      'offer_document_' || lower(TG_OP),
      'storage_object',
      jsonb_build_object(
        'bucket', NEW.bucket_id,
        'name', NEW.name,
        'operation', TG_OP
      )
    );
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger for audit logging on offer-documents bucket
DROP TRIGGER IF EXISTS audit_offer_documents_access ON storage.objects;

CREATE TRIGGER audit_offer_documents_access
AFTER INSERT OR UPDATE OR DELETE ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION log_offer_document_access();