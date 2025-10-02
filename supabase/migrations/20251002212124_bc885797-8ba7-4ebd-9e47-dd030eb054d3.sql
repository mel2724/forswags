-- Create promo codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  max_uses INTEGER,
  times_used INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  applicable_products JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create promo code usage tracking table
CREATE TABLE IF NOT EXISTS public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  stripe_subscription_id TEXT,
  discount_amount NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create refunds tracking table
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_refund_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes
CREATE POLICY "Admins can manage promo codes"
  ON public.promo_codes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active promo codes"
  ON public.promo_codes
  FOR SELECT
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- RLS Policies for promo_code_usage
CREATE POLICY "Admins can view all promo code usage"
  ON public.promo_code_usage
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own promo code usage"
  ON public.promo_code_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert promo code usage"
  ON public.promo_code_usage
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for refunds
CREATE POLICY "Admins can manage refunds"
  ON public.refunds
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own refunds"
  ON public.refunds
  FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_codes_active ON public.promo_codes(is_active) WHERE is_active = true;
CREATE INDEX idx_promo_code_usage_user ON public.promo_code_usage(user_id);
CREATE INDEX idx_promo_code_usage_promo_code ON public.promo_code_usage(promo_code_id);
CREATE INDEX idx_refunds_user ON public.refunds(user_id);
CREATE INDEX idx_refunds_stripe_payment ON public.refunds(stripe_payment_intent_id);

-- Function to validate and apply promo code
CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code TEXT, p_product_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo_code promo_codes%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Get promo code
  SELECT * INTO v_promo_code
  FROM promo_codes
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > now())
    AND (valid_from IS NULL OR valid_from <= now());
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired promo code');
  END IF;
  
  -- Check usage limits
  IF v_promo_code.max_uses IS NOT NULL AND v_promo_code.times_used >= v_promo_code.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Promo code has reached maximum usage');
  END IF;
  
  -- Check if applicable to product
  IF jsonb_array_length(v_promo_code.applicable_products) > 0 THEN
    IF NOT (v_promo_code.applicable_products @> to_jsonb(p_product_id::text)) THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Promo code not applicable to this product');
    END IF;
  END IF;
  
  -- Return valid promo code details
  v_result := jsonb_build_object(
    'valid', true,
    'id', v_promo_code.id,
    'code', v_promo_code.code,
    'discount_type', v_promo_code.discount_type,
    'discount_value', v_promo_code.discount_value
  );
  
  RETURN v_result;
END;
$$;