-- Add public profile consent field to athletes table
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS public_profile_consent boolean DEFAULT false;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_athletes_public_consent ON athletes(public_profile_consent) WHERE public_profile_consent = true;

-- Create function to check if user is a paid recruiter
CREATE OR REPLACE FUNCTION public.is_paid_recruiter(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM memberships m
    JOIN user_roles ur ON ur.user_id = m.user_id
    WHERE m.user_id = p_user_id
      AND ur.role = 'recruiter'
      AND m.status = 'active'
      AND m.plan IN ('pro_monthly', 'championship_yearly')
  );
END;
$$;

-- Drop old overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view public athlete profiles" ON athletes;
DROP POLICY IF EXISTS "Recruiters can view public athlete profiles" ON athletes;

-- New policy: Public profiles viewable by direct link (for PublicProfile page) only with consent
CREATE POLICY "Public profiles viewable with consent"
ON athletes
FOR SELECT
USING (
  visibility = 'public' 
  AND public_profile_consent = true
);

-- Policy: Paid recruiters can search and view all public profiles (for search functionality)
CREATE POLICY "Paid recruiters can search public profiles"
ON athletes
FOR SELECT
USING (
  visibility = 'public'
  AND public_profile_consent = true
  AND is_paid_recruiter(auth.uid())
);

-- Policy: Athletes can still view their own profiles
-- (keeping existing policy, no changes needed)

-- Policy: Parents can still view their children's profiles  
-- (keeping existing policy, no changes needed)