-- Create function to check if a recruiter has an active paid membership
CREATE OR REPLACE FUNCTION public.is_paid_recruiter(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_paid_membership BOOLEAN;
BEGIN
  -- Check if user has an active recruiter membership
  SELECT EXISTS(
    SELECT 1
    FROM public.memberships
    WHERE user_id = p_user_id
    AND tier IN ('college_scout', 'recruiter', 'premium')
    AND status = 'active'
    AND (end_date IS NULL OR end_date > NOW())
  ) INTO v_has_paid_membership;
  
  RETURN v_has_paid_membership;
END;
$$;