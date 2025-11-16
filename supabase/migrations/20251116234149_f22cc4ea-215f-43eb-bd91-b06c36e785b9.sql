-- Fix is_paid_recruiter function to use 'plan' instead of 'tier'
CREATE OR REPLACE FUNCTION public.is_paid_recruiter(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_paid_membership BOOLEAN;
BEGIN
  -- Check if user has an active recruiter membership
  -- FIXED: Changed 'tier' to 'plan' to match actual memberships table schema
  SELECT EXISTS(
    SELECT 1
    FROM public.memberships
    WHERE user_id = p_user_id
    AND plan IN ('college_scout', 'recruiter', 'premium')
    AND status = 'active'
    AND (end_date IS NULL OR end_date > NOW())
  ) INTO v_has_paid_membership;
  
  RETURN v_has_paid_membership;
END;
$$;