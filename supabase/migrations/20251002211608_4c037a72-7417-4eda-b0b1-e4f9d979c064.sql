-- Update has_feature_access function to grant admins access to all features
CREATE OR REPLACE FUNCTION public.has_feature_access(p_user_id uuid, p_feature_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tier text;
  v_has_access boolean;
BEGIN
  -- Admins have access to all features
  IF public.has_role(p_user_id, 'admin') THEN
    RETURN true;
  END IF;
  
  -- Check tier-based access for non-admins
  v_tier := public.get_user_tier(p_user_id);
  
  SELECT is_enabled INTO v_has_access
  FROM tier_features
  WHERE tier = v_tier AND feature_key = p_feature_key;
  
  RETURN COALESCE(v_has_access, false);
END;
$$;