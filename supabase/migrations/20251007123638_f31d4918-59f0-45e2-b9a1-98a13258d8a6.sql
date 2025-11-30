-- Add renewal reminder tracking table
CREATE TABLE IF NOT EXISTS public.membership_renewal_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('30_days', '7_days', '1_day')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(membership_id, reminder_type)
);

-- Enable RLS
ALTER TABLE public.membership_renewal_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own renewal reminders"
ON public.membership_renewal_reminders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert renewal reminders"
ON public.membership_renewal_reminders
FOR INSERT
WITH CHECK (true);

-- Update tier_features for free tier
INSERT INTO public.tier_features (tier, feature_key, is_enabled, limit_value)
VALUES 
  ('free', 'video_upload_limit', true, 1),
  ('free', 'profile_type', true, 0),
  ('free', 'playbook_access', true, 0)
ON CONFLICT (tier, feature_key) 
DO UPDATE SET 
  is_enabled = EXCLUDED.is_enabled,
  limit_value = EXCLUDED.limit_value;

-- Function to check if membership allows login
CREATE OR REPLACE FUNCTION public.can_user_login(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership RECORD;
  v_result JSONB;
BEGIN
  -- Get active membership
  SELECT * INTO v_membership
  FROM memberships
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- No membership found - allow login (free tier)
  IF v_membership IS NULL THEN
    RETURN jsonb_build_object(
      'can_login', true,
      'reason', 'free_tier',
      'tier', 'free'
    );
  END IF;
  
  -- Check if membership is expired
  IF v_membership.status = 'active' AND v_membership.end_date IS NOT NULL 
     AND v_membership.end_date < now() THEN
    RETURN jsonb_build_object(
      'can_login', false,
      'reason', 'membership_expired',
      'tier', v_membership.plan,
      'expired_at', v_membership.end_date
    );
  END IF;
  
  -- Check if payment failed
  IF v_membership.status = 'past_due' THEN
    RETURN jsonb_build_object(
      'can_login', false,
      'reason', 'payment_failed',
      'tier', v_membership.plan
    );
  END IF;
  
  -- All checks passed
  RETURN jsonb_build_object(
    'can_login', true,
    'reason', 'active_membership',
    'tier', v_membership.plan,
    'end_date', v_membership.end_date
  );
END;
$$;

-- Function to get membership status with renewal reminders
CREATE OR REPLACE FUNCTION public.get_membership_status(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership RECORD;
  v_days_until_renewal INTEGER;
  v_result JSONB;
BEGIN
  -- Get active membership
  SELECT * INTO v_membership
  FROM memberships
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing', 'past_due')
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- No active membership
  IF v_membership IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'free',
      'tier', 'free',
      'needs_renewal', false
    );
  END IF;
  
  -- Calculate days until renewal
  IF v_membership.end_date IS NOT NULL THEN
    v_days_until_renewal := EXTRACT(DAY FROM (v_membership.end_date - now()));
  ELSE
    v_days_until_renewal := NULL;
  END IF;
  
  v_result := jsonb_build_object(
    'status', v_membership.status,
    'tier', v_membership.plan,
    'end_date', v_membership.end_date,
    'days_until_renewal', v_days_until_renewal,
    'needs_renewal', v_days_until_renewal IS NOT NULL AND v_days_until_renewal <= 30,
    'is_urgent', v_days_until_renewal IS NOT NULL AND v_days_until_renewal <= 7,
    'is_critical', v_days_until_renewal IS NOT NULL AND v_days_until_renewal <= 1
  );
  
  RETURN v_result;
END;
$$;