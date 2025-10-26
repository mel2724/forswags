-- Add sport field to recruiter_profiles
ALTER TABLE public.recruiter_profiles
ADD COLUMN IF NOT EXISTS sport text;

-- Create security definer function to get recruiter sport
CREATE OR REPLACE FUNCTION public.get_recruiter_sport(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sport text;
BEGIN
  SELECT sport INTO v_sport
  FROM recruiter_profiles
  WHERE user_id = p_user_id;
  
  RETURN v_sport;
END;
$$;

-- Drop existing recruiter RLS policies on athletes table if they exist
DROP POLICY IF EXISTS "Recruiters can view stats for accessible athletes" ON public.athlete_stats;
DROP POLICY IF EXISTS "Recruiters can view accessible athletes" ON public.athletes;

-- Create new policy for recruiters to only see athletes in their sport
CREATE POLICY "Recruiters can view athletes in their sport"
ON public.athletes
FOR SELECT
TO authenticated
USING (
  -- Allow if user is a recruiter AND (no sport preference OR athlete's sport matches recruiter's sport)
  has_role(auth.uid(), 'recruiter')
  AND (
    get_recruiter_sport(auth.uid()) IS NULL 
    OR sport = get_recruiter_sport(auth.uid())
  )
  AND visibility = 'public'
  AND public_profile_consent = true
  AND (
    is_minor(date_of_birth) = false 
    OR (is_minor(date_of_birth) = true AND is_parent_verified = true)
  )
);

-- Update athlete_stats policy to match
CREATE POLICY "Recruiters can view stats for athletes in their sport"
ON public.athlete_stats
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'recruiter')
  AND EXISTS (
    SELECT 1 FROM athletes a
    WHERE a.id = athlete_stats.athlete_id
    AND (
      get_recruiter_sport(auth.uid()) IS NULL 
      OR a.sport = get_recruiter_sport(auth.uid())
    )
    AND a.visibility = 'public'
    AND a.public_profile_consent = true
    AND (
      is_minor(a.date_of_birth) = false 
      OR (is_minor(a.date_of_birth) = true AND a.is_parent_verified = true)
    )
  )
);