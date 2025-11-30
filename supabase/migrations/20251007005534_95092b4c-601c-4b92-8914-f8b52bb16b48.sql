-- SECURITY FIX: Enhanced protection for minor athlete social media handles
-- This addresses the CRITICAL finding for exposed minor contact information

-- Update the get_safe_athlete_profile function to ALWAYS hide social handles for minors
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
  v_is_minor boolean;
BEGIN
  -- Check if caller is a paid recruiter
  v_is_paid_recruiter := has_role(auth.uid(), 'recruiter') AND public.has_feature_access(auth.uid(), 'view_contact_info');
  
  -- Get athlete data
  SELECT to_jsonb(a), a.user_id, public.is_minor(a.date_of_birth) 
  INTO v_profile, v_owner_id, v_is_minor
  FROM athletes a
  WHERE a.id = p_athlete_id;
  
  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- CRITICAL: ALWAYS hide social handles for minors, regardless of role
  -- This protects minors from direct contact attempts
  IF v_is_minor THEN
    v_profile := v_profile - 'twitter_handle' - 'instagram_handle' - 'tiktok_handle';
  ELSE
    -- For adults, only show social handles to paid recruiters or owner
    IF NOT (v_is_paid_recruiter OR v_owner_id = auth.uid()) THEN
      v_profile := v_profile - 'twitter_handle' - 'instagram_handle' - 'tiktok_handle';
    END IF;
  END IF;
  
  -- Log access for audit trail (optional but recommended)
  IF auth.uid() IS NOT NULL AND auth.uid() != v_owner_id THEN
    INSERT INTO profile_views (athlete_id, viewer_id, viewer_type)
    VALUES (
      p_athlete_id,
      auth.uid(),
      CASE 
        WHEN has_role(auth.uid(), 'recruiter') THEN 'recruiter'
        WHEN has_role(auth.uid(), 'coach') THEN 'coach'
        ELSE 'other'
      END
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN v_profile;
END;
$$;

COMMENT ON FUNCTION public.get_safe_athlete_profile IS 'Returns athlete profile with sensitive data filtered based on viewer role and athlete age. Always hides social media handles for minors.';