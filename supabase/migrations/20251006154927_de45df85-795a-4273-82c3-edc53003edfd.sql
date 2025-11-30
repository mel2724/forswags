-- Fix 1: Drop existing policies on schools and recreate them properly
DO $$ 
BEGIN
  ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Anyone can view schools" ON schools;
CREATE POLICY "Anyone can view schools"
ON schools FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage schools" ON schools;
CREATE POLICY "Admins can manage schools"
ON schools FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Fix 2: Add missing promo codes RLS policies
DROP POLICY IF EXISTS "Admins can create promo codes" ON promo_codes;
CREATE POLICY "Admins can create promo codes"
ON promo_codes FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update promo codes" ON promo_codes;
CREATE POLICY "Admins can update promo codes"
ON promo_codes FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete promo codes" ON promo_codes;
CREATE POLICY "Admins can delete promo codes"
ON promo_codes FOR DELETE
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view active promo codes" ON promo_codes;
CREATE POLICY "Users can view active promo codes"
ON promo_codes FOR SELECT
USING (
  is_active = true 
  AND (valid_until IS NULL OR valid_until > now())
);

-- Fix 3: Add storage policies for offer-documents bucket
DROP POLICY IF EXISTS "Athletes can view own offer documents" ON storage.objects;
CREATE POLICY "Athletes can view own offer documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'offer-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Athletes can upload offer documents" ON storage.objects;
CREATE POLICY "Athletes can upload offer documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'offer-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Athletes can update offer documents" ON storage.objects;
CREATE POLICY "Athletes can update offer documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'offer-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Athletes can delete offer documents" ON storage.objects;
CREATE POLICY "Athletes can delete offer documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'offer-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Parents can view children offer documents" ON storage.objects;
CREATE POLICY "Parents can view children offer documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'offer-documents' AND
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.parent_id = auth.uid()
    AND athletes.user_id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "Admins can view all offer documents" ON storage.objects;
CREATE POLICY "Admins can view all offer documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'offer-documents' AND
  has_role(auth.uid(), 'admin')
);

-- Fix 4: Add parent email verification fields for COPPA compliance
ALTER TABLE athletes
ADD COLUMN IF NOT EXISTS parent_email text,
ADD COLUMN IF NOT EXISTS parent_verification_sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS parent_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS consent_expires_at timestamp with time zone;

-- Create parent verification tracking table
CREATE TABLE IF NOT EXISTS parent_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE,
  parent_email text NOT NULL,
  verification_code text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT now() + interval '24 hours',
  verified_at timestamp with time zone,
  ip_address inet
);

-- Enable RLS on parent_verifications
DO $$ 
BEGIN
  ALTER TABLE parent_verifications ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Athletes can view own verifications" ON parent_verifications;
CREATE POLICY "Athletes can view own verifications"
ON parent_verifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.id = parent_verifications.athlete_id
    AND athletes.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can insert verifications" ON parent_verifications;
CREATE POLICY "System can insert verifications"
ON parent_verifications FOR INSERT
WITH CHECK (true);

-- Fix 5: Create function to check expired consents
CREATE OR REPLACE FUNCTION check_expired_consents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE athletes
  SET public_profile_consent = false,
      visibility = 'private'
  WHERE is_minor(date_of_birth) = true
    AND consent_expires_at < now()
    AND public_profile_consent = true;
END;
$$;