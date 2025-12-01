-- Fix log_audit_event to handle system operations (NULL user_id from edge functions)
-- This allows edge functions to log audit events without requiring an authenticated user

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text, 
  p_resource_type text, 
  p_resource_id uuid DEFAULT NULL::uuid, 
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_log_id UUID;
  v_user_id UUID;
BEGIN
  -- Get user ID from auth context, or use NULL for system operations
  v_user_id := auth.uid();
  
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata
  ) VALUES (
    v_user_id,  -- Can be NULL for system operations
    p_action,
    p_resource_type,
    p_resource_id,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$function$;

-- Allow NULL user_id in audit_logs for system operations
ALTER TABLE public.audit_logs 
ALTER COLUMN user_id DROP NOT NULL;