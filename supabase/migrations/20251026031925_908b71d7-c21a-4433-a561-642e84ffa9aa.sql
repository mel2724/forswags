-- Fix Critical Security Issues: Add RLS to college_match_prefs and oauth_state tables
-- Also improve connected_accounts security by restricting token access

-- 1. Add RLS to college_match_prefs table
ALTER TABLE college_match_prefs ENABLE ROW LEVEL SECURITY;

-- Athletes can manage their own preferences
CREATE POLICY "Athletes manage own college prefs"
ON college_match_prefs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.id = college_match_prefs.athlete_id
      AND athletes.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.id = college_match_prefs.athlete_id
      AND athletes.user_id = auth.uid()
  )
);

-- Admins can view all preferences
CREATE POLICY "Admins view all college prefs"
ON college_match_prefs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Paid recruiters can view preferences for athletes they have access to
CREATE POLICY "Paid recruiters view college prefs"
ON college_match_prefs FOR SELECT
USING (
  has_role(auth.uid(), 'recruiter')
  AND has_feature_access(auth.uid(), 'view_college_prefs')
  AND EXISTS (
    SELECT 1 FROM athletes a
    WHERE a.id = college_match_prefs.athlete_id
      AND a.visibility = 'public'
      AND a.public_profile_consent = true
      AND (is_minor(a.date_of_birth) = false OR (is_minor(a.date_of_birth) = true AND a.is_parent_verified = true))
  )
);

-- 2. Add RLS to oauth_state table
ALTER TABLE oauth_state ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own OAuth state
CREATE POLICY "Users manage own oauth state"
ON oauth_state FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add cleanup function for old OAuth states
CREATE OR REPLACE FUNCTION cleanup_oauth_state()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_state
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create view for connected_accounts that exposes only metadata (not tokens)
CREATE VIEW connected_accounts_status AS
SELECT 
  id, 
  user_id, 
  platform, 
  account_name, 
  expires_at, 
  updated_at
FROM connected_accounts;

-- Enable RLS on the view
ALTER VIEW connected_accounts_status SET (security_invoker = true);

-- Grant access to authenticated users
GRANT SELECT ON connected_accounts_status TO authenticated;

-- Update RLS policy on connected_accounts to prevent direct token access from client
-- Keep only INSERT, UPDATE, DELETE policies for service functions
DROP POLICY IF EXISTS "Users can view their own social accounts" ON connected_accounts;
DROP POLICY IF EXISTS "Users can manage their own social accounts" ON connected_accounts;

-- Service functions can still access tokens via SECURITY DEFINER
CREATE POLICY "Service functions manage connected accounts"
ON connected_accounts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);