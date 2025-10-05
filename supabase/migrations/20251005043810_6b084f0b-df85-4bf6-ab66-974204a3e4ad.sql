-- Fix 1: Add RLS policies to user_roles table
-- Only admins can assign roles
CREATE POLICY "Only admins can assign roles" ON public.user_roles
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can revoke roles
CREATE POLICY "Only admins can revoke roles" ON public.user_roles
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Fix 2: Create admin_sessions table for secure impersonation
CREATE TABLE public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  impersonated_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '1 hour'),
  ended_at timestamp with time zone
);

-- Add constraint separately
ALTER TABLE public.admin_sessions 
ADD CONSTRAINT valid_session_time CHECK (expires_at > created_at);

-- Enable RLS on admin_sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Only admins can create impersonation sessions
CREATE POLICY "Only admins can create sessions" ON public.admin_sessions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') AND admin_user_id = auth.uid());

-- Only admins can view and end their own sessions
CREATE POLICY "Admins can manage their sessions" ON public.admin_sessions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin') AND admin_user_id = auth.uid());

-- Create index for performance (without WHERE clause that uses now())
CREATE INDEX idx_admin_sessions_lookup ON public.admin_sessions(admin_user_id, impersonated_user_id, ended_at, expires_at);

-- Function to get current impersonated user (if any)
CREATE OR REPLACE FUNCTION public.get_impersonated_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_impersonated_id uuid;
BEGIN
  SELECT impersonated_user_id INTO v_impersonated_id
  FROM admin_sessions
  WHERE admin_user_id = auth.uid()
    AND ended_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN v_impersonated_id;
END;
$$;

-- Function to start impersonation session
CREATE OR REPLACE FUNCTION public.start_impersonation_session(p_impersonated_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  -- Only admins can impersonate
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can impersonate users';
  END IF;
  
  -- End any existing sessions for this admin
  UPDATE admin_sessions
  SET ended_at = now()
  WHERE admin_user_id = auth.uid()
    AND ended_at IS NULL;
  
  -- Create new session
  INSERT INTO admin_sessions (admin_user_id, impersonated_user_id)
  VALUES (auth.uid(), p_impersonated_user_id)
  RETURNING id INTO v_session_id;
  
  -- Log security event
  PERFORM log_security_event(
    'impersonation_started',
    'high',
    'Admin started impersonation session',
    jsonb_build_object(
      'admin_id', auth.uid(),
      'impersonated_user_id', p_impersonated_user_id,
      'session_id', v_session_id
    )
  );
  
  RETURN v_session_id;
END;
$$;

-- Function to end impersonation session
CREATE OR REPLACE FUNCTION public.end_impersonation_session()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE admin_sessions
  SET ended_at = now()
  WHERE admin_user_id = auth.uid()
    AND ended_at IS NULL;
    
  -- Log security event
  PERFORM log_security_event(
    'impersonation_ended',
    'medium',
    'Admin ended impersonation session',
    jsonb_build_object('admin_id', auth.uid())
  );
END;
$$;

-- Fix 3: Add COPPA compliance fields to athletes table
ALTER TABLE public.athletes
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS consent_verified_by text,
ADD COLUMN IF NOT EXISTS consent_timestamp timestamp with time zone,
ADD COLUMN IF NOT EXISTS consent_ip_address inet,
ADD COLUMN IF NOT EXISTS is_parent_verified boolean DEFAULT false;

-- Function to check if athlete is a minor
CREATE OR REPLACE FUNCTION public.is_minor(p_date_of_birth date)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT EXTRACT(YEAR FROM age(p_date_of_birth)) < 18;
$$;

-- Fix 4: Enable pgcrypto for OAuth token encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted token columns
ALTER TABLE public.connected_accounts
ADD COLUMN IF NOT EXISTS encrypted_access_token bytea,
ADD COLUMN IF NOT EXISTS encrypted_refresh_token bytea;