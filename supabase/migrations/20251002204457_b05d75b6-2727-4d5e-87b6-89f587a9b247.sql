-- Add membership tier tracking and data archival
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS payment_failed_at timestamp with time zone;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS downgraded_at timestamp with time zone;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS archived_data jsonb DEFAULT '{}'::jsonb;

-- Create tier_features table to track what features are available per tier
CREATE TABLE IF NOT EXISTS tier_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL,
  feature_key text NOT NULL,
  is_enabled boolean DEFAULT false,
  limit_value integer,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(tier, feature_key)
);

-- Enable RLS on tier_features
ALTER TABLE tier_features ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists and recreate
DROP POLICY IF EXISTS "Anyone can view tier features" ON tier_features;
CREATE POLICY "Anyone can view tier features"
ON tier_features FOR SELECT
USING (true);

-- Insert default tier features (using ON CONFLICT to handle duplicates)
INSERT INTO tier_features (tier, feature_key, is_enabled, limit_value) VALUES
  -- Free tier limitations
  ('free', 'public_profile', false, NULL),
  ('free', 'college_matching', false, NULL),
  ('free', 'analytics', false, NULL),
  ('free', 'profile_view_notifications', false, NULL),
  ('free', 'rankings', false, NULL),
  ('free', 'evaluation_initial_price', true, 19700),
  ('free', 'evaluation_reeval_price', true, 19700),
  
  -- Pro Monthly tier features
  ('pro_monthly', 'public_profile', true, NULL),
  ('pro_monthly', 'college_matching', true, NULL),
  ('pro_monthly', 'analytics', true, NULL),
  ('pro_monthly', 'profile_view_notifications', true, NULL),
  ('pro_monthly', 'rankings', true, NULL),
  ('pro_monthly', 'evaluation_initial_price', true, 9700),
  ('pro_monthly', 'evaluation_reeval_price', true, 4900),
  
  -- Championship Yearly tier features
  ('championship_yearly', 'public_profile', true, NULL),
  ('championship_yearly', 'college_matching', true, NULL),
  ('championship_yearly', 'analytics', true, NULL),
  ('championship_yearly', 'profile_view_notifications', true, NULL),
  ('championship_yearly', 'rankings', true, NULL),
  ('championship_yearly', 'evaluation_initial_price', true, 9700),
  ('championship_yearly', 'evaluation_reeval_price', true, 4900),
  
  -- Recruiter tier features
  ('recruiter_monthly', 'view_contact_info', true, NULL),
  ('recruiter_yearly', 'view_contact_info', true, NULL)
ON CONFLICT (tier, feature_key) DO NOTHING;

-- Create function to get user's tier
CREATE OR REPLACE FUNCTION public.get_user_tier(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier text;
BEGIN
  SELECT 
    CASE 
      WHEN m.plan = 'free' THEN 'free'
      WHEN m.plan = 'pro_monthly' THEN 'pro_monthly'
      WHEN m.plan = 'championship_yearly' THEN 'championship_yearly'
      ELSE 'free'
    END INTO v_tier
  FROM memberships m
  WHERE m.user_id = p_user_id
    AND m.status = 'active'
  ORDER BY m.created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_tier, 'free');
END;
$$;

-- Create function to check if user has feature access
CREATE OR REPLACE FUNCTION public.has_feature_access(p_user_id uuid, p_feature_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier text;
  v_has_access boolean;
BEGIN
  v_tier := public.get_user_tier(p_user_id);
  
  SELECT is_enabled INTO v_has_access
  FROM tier_features
  WHERE tier = v_tier AND feature_key = p_feature_key;
  
  RETURN COALESCE(v_has_access, false);
END;
$$;

-- Create function to get evaluation price for user
CREATE OR REPLACE FUNCTION public.get_user_evaluation_price(p_user_id uuid, p_is_reevaluation boolean)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier text;
  v_price integer;
  v_feature_key text;
BEGIN
  v_tier := public.get_user_tier(p_user_id);
  
  v_feature_key := CASE 
    WHEN p_is_reevaluation THEN 'evaluation_reeval_price'
    ELSE 'evaluation_initial_price'
  END;
  
  SELECT limit_value INTO v_price
  FROM tier_features
  WHERE tier = v_tier AND feature_key = v_feature_key;
  
  RETURN COALESCE(v_price, 19700);
END;
$$;

-- Function to archive paid tier data on downgrade
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
  SELECT id INTO v_membership_id
  FROM memberships
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_membership_id IS NULL THEN
    RETURN;
  END IF;
  
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
    )
  );
  
  UPDATE memberships
  SET archived_data = v_archived_data, downgraded_at = now()
  WHERE id = v_membership_id;
END;
$$;

-- Update athletes table
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS tier_based_visibility boolean DEFAULT true;

-- Update RLS policy for tier-based visibility
DROP POLICY IF EXISTS "Authenticated users can view public athlete profiles" ON athletes;
CREATE POLICY "Authenticated users can view public athlete profiles"
ON athletes FOR SELECT
USING (
  (visibility = 'public' AND public.has_feature_access(user_id, 'public_profile'))
  OR auth.uid() = user_id
  OR auth.uid() = parent_id
  OR has_role(auth.uid(), 'recruiter')
);

-- Function to get safe athlete profile (hides contact info from non-paid recruiters)
CREATE OR REPLACE FUNCTION public.get_safe_athlete_profile(p_athlete_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile jsonb;
  v_is_paid_recruiter boolean;
  v_owner_id uuid;
BEGIN
  v_is_paid_recruiter := has_role(auth.uid(), 'recruiter') AND public.has_feature_access(auth.uid(), 'view_contact_info');
  
  SELECT to_jsonb(a), a.user_id INTO v_profile, v_owner_id
  FROM athletes a
  WHERE a.id = p_athlete_id;
  
  IF NOT (v_is_paid_recruiter OR v_owner_id = auth.uid()) THEN
    v_profile := v_profile - 'twitter_handle' - 'instagram_handle' - 'tiktok_handle';
  END IF;
  
  RETURN v_profile;
END;
$$;