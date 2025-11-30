-- Fix 1: Restrict user_roles SELECT policy to prevent role enumeration
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Any authenticated user can view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Allow users to view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Fix 2: Add OAuth token encryption/decryption functions
CREATE OR REPLACE FUNCTION public.encrypt_oauth_token(token text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  encryption_key := encode(digest('oauth_encryption_key_v1', 'sha256'), 'hex');
  RETURN pgp_sym_encrypt(token, encryption_key);
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_oauth_token(encrypted_token bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF encrypted_token IS NULL THEN
    RETURN NULL;
  END IF;
  
  encryption_key := encode(digest('oauth_encryption_key_v1', 'sha256'), 'hex');
  RETURN pgp_sym_decrypt(encrypted_token, encryption_key);
END;
$$;

-- Fix 3: Enhance COPPA compliance
CREATE OR REPLACE FUNCTION public.calculate_age(p_date_of_birth date)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT EXTRACT(YEAR FROM age(p_date_of_birth))::integer;
$$;

-- Update athlete visibility policies for COPPA compliance
DROP POLICY IF EXISTS "Public profiles viewable with consent" ON public.athletes;
DROP POLICY IF EXISTS "Recruiters can view contact info for consented adults" ON public.athletes;

CREATE POLICY "Public profiles viewable with consent"
ON public.athletes
FOR SELECT
USING (
  visibility = 'public' 
  AND public_profile_consent = true
  AND (
    (is_minor(date_of_birth) = false)
    OR 
    (is_minor(date_of_birth) = true AND is_parent_verified = true)
  )
);

CREATE POLICY "Recruiters can view contact info for consented adults"
ON public.athletes
FOR SELECT
USING (
  is_paid_recruiter(auth.uid())
  AND visibility = 'public'
  AND public_profile_consent = true
  AND (
    (is_minor(date_of_birth) = false)
    OR
    (is_minor(date_of_birth) = true AND is_parent_verified = true)
  )
);