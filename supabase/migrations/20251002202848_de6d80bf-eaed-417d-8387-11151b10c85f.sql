-- CRITICAL SECURITY FIX: Protect minor athlete data and sensitive information

-- 1. FIX PROFILES TABLE - Remove public access to email/phone
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Only allow users to view their own profile and admins to view all
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- 2. FIX ATHLETES TABLE - CRITICAL: Protect minor data, require authentication
DROP POLICY IF EXISTS "Anyone can view public athlete profiles" ON public.athletes;

-- Require authentication to view any athlete profile
CREATE POLICY "Authenticated users can view public athlete profiles"
ON public.athletes
FOR SELECT
TO authenticated
USING (visibility = 'public');

-- Athletes can view their own profile regardless of visibility
CREATE POLICY "Athletes can view own profile"
ON public.athletes
FOR SELECT
USING (auth.uid() = user_id);

-- Recruiters with proper role can view public profiles
CREATE POLICY "Recruiters can view public athlete profiles"
ON public.athletes
FOR SELECT
TO authenticated
USING (
  visibility = 'public' 
  AND has_role(auth.uid(), 'recruiter')
);

-- 3. FIX COACH APPLICATIONS - Restrict to admins and owner only
DROP POLICY IF EXISTS "Users can view their own applications" ON public.coach_applications;

-- Only admins and the applicant can view applications
CREATE POLICY "Admins and applicants can view applications"
ON public.coach_applications
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') 
  OR (auth.jwt() ->> 'email') = email
);

-- 4. FIX RECRUITER PROFILES - Restrict access properly
DROP POLICY IF EXISTS "Recruiters can view all profiles" ON public.recruiter_profiles;

-- Only authenticated users can view recruiter info
CREATE POLICY "Authenticated users can view recruiter profiles"
ON public.recruiter_profiles
FOR SELECT
TO authenticated
USING (true);

-- Recruiters can view their own full profile
CREATE POLICY "Recruiters can view own profile"
ON public.recruiter_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- 5. FIX ALUMNI TABLE - Require authentication
DROP POLICY IF EXISTS "Anyone can view alumni profiles" ON public.alumni;

CREATE POLICY "Authenticated users can view alumni"
ON public.alumni
FOR SELECT
TO authenticated
USING (true);

-- 6. ADD SECURITY EVENTS TABLE for tracking security incidents
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view security events"
ON public.security_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- System can insert security events
CREATE POLICY "System can insert security events"
ON public.security_events
FOR INSERT
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);

-- 7. ADD FUNCTION to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_severity TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    p_event_type,
    p_severity,
    p_description,
    p_metadata
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- 8. FIX FUNCTION SEARCH PATHS for existing functions
CREATE OR REPLACE FUNCTION public.get_profile_view_stats(p_athlete_id uuid, p_days integer DEFAULT 30)
RETURNS TABLE(total_views bigint, unique_viewers bigint, recruiter_views bigint, coach_views bigint, recent_views jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_views,
    COUNT(DISTINCT viewer_id)::BIGINT as unique_viewers,
    COUNT(CASE WHEN viewer_type = 'recruiter' THEN 1 END)::BIGINT as recruiter_views,
    COUNT(CASE WHEN viewer_type = 'coach' THEN 1 END)::BIGINT as coach_views,
    jsonb_agg(
      jsonb_build_object(
        'viewer_id', viewer_id,
        'viewer_type', viewer_type,
        'viewed_at', viewed_at
      ) ORDER BY viewed_at DESC
    ) FILTER (WHERE viewed_at >= now() - (p_days || ' days')::interval) as recent_views
  FROM profile_views
  WHERE athlete_id = p_athlete_id
    AND viewed_at >= now() - (p_days || ' days')::interval;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_engagement_stats(p_user_id uuid, p_days integer DEFAULT 30)
RETURNS TABLE(total_engagements bigint, views bigint, shares bigint, downloads bigint, engagement_by_type jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_engagements,
    COUNT(CASE WHEN action_type = 'view' THEN 1 END)::BIGINT as views,
    COUNT(CASE WHEN action_type = 'share' THEN 1 END)::BIGINT as shares,
    COUNT(CASE WHEN action_type = 'download' THEN 1 END)::BIGINT as downloads,
    jsonb_object_agg(
      content_type,
      COUNT(*)
    ) as engagement_by_type
  FROM engagement_metrics
  WHERE user_id = p_user_id
    AND created_at >= now() - (p_days || ' days')::interval
  GROUP BY user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_evaluation_composite_score(eval_scores jsonb)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  total numeric := 0;
  count integer := 0;
  key text;
  value numeric;
BEGIN
  FOR key, value IN SELECT * FROM jsonb_each_text(eval_scores)
  LOOP
    total := total + value::numeric;
    count := count + 1;
  END LOOP;
  
  IF count > 0 THEN
    RETURN total / count;
  ELSE
    RETURN 0;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_request_reevaluation(p_athlete_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_eval_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT MAX(completed_at) INTO last_eval_date
  FROM evaluations
  WHERE athlete_id = p_athlete_id
    AND status = 'completed';
  
  IF last_eval_date IS NULL THEN
    RETURN true;
  END IF;
  
  RETURN (CURRENT_TIMESTAMP - last_eval_date) >= INTERVAL '2 months';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_evaluation_price(p_athlete_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_purchase_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT MAX(purchased_at) INTO last_purchase_date
  FROM evaluations
  WHERE athlete_id = p_athlete_id;
  
  IF last_purchase_date IS NULL THEN
    RETURN 'initial';
  END IF;
  
  IF (CURRENT_TIMESTAMP - last_purchase_date) <= INTERVAL '1 year' THEN
    RETURN 'reevaluation';
  ELSE
    RETURN 'initial';
  END IF;
END;
$$;