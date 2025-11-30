-- Fix 1: Remove public access to promo codes and restrict to admins only
DROP POLICY IF EXISTS "Anyone can view promo codes" ON public.promo_codes;

CREATE POLICY "Admins can view promo codes"
  ON public.promo_codes FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Fix 2: Add system INSERT policy for user_badges to allow badge awards
CREATE POLICY "System can award badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (true);

-- Fix 3: Add UPDATE policy for consent_renewal_notifications email tracking
CREATE POLICY "System can update email sent timestamp"
  ON public.consent_renewal_notifications FOR UPDATE
  USING (true)
  WITH CHECK (true);