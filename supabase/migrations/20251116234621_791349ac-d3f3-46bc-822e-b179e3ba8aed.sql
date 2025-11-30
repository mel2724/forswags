-- Fix is_paid_recruiter to use valid membership plan enum values
-- Valid plans are: free, annual, monthly, pro_monthly, championship_yearly
CREATE OR REPLACE FUNCTION public.is_paid_recruiter(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_paid_membership BOOLEAN;
BEGIN
  -- Check if user has an active paid recruiter membership
  -- Recruiters need pro_monthly, championship_yearly, or annual plans
  SELECT EXISTS(
    SELECT 1
    FROM public.memberships
    WHERE user_id = p_user_id
    AND plan IN ('pro_monthly', 'championship_yearly', 'annual', 'monthly')
    AND status = 'active'
    AND (end_date IS NULL OR end_date > NOW())
  ) INTO v_has_paid_membership;
  
  RETURN v_has_paid_membership;
END;
$$;