-- Create table to track secret rotation status
CREATE TABLE IF NOT EXISTS public.secret_rotation_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  secret_name TEXT NOT NULL UNIQUE,
  last_rotated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  rotation_frequency_days INTEGER NOT NULL DEFAULT 90,
  next_rotation_due TIMESTAMP WITH TIME ZONE,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  rotation_notes TEXT,
  rotated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.secret_rotation_tracking ENABLE ROW LEVEL SECURITY;

-- Only admins can view secret rotation tracking
CREATE POLICY "Admins can view secret rotation tracking"
ON public.secret_rotation_tracking
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only admins can update rotation records
CREATE POLICY "Admins can update secret rotation tracking"
ON public.secret_rotation_tracking
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert rotation records
CREATE POLICY "Admins can insert secret rotation tracking"
ON public.secret_rotation_tracking
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Function to update next_rotation_due
CREATE OR REPLACE FUNCTION public.update_secret_rotation_due()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.next_rotation_due := NEW.last_rotated_at + (NEW.rotation_frequency_days || ' days')::INTERVAL;
  RETURN NEW;
END;
$function$;

-- Trigger to automatically calculate next_rotation_due
CREATE TRIGGER calculate_next_rotation_due
  BEFORE INSERT OR UPDATE OF last_rotated_at, rotation_frequency_days
  ON public.secret_rotation_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_secret_rotation_due();

-- Create function to mark secret as rotated
CREATE OR REPLACE FUNCTION public.mark_secret_rotated(
  p_secret_name TEXT,
  p_rotation_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  -- Only admins can rotate secrets
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Update rotation record
  UPDATE secret_rotation_tracking
  SET 
    last_rotated_at = now(),
    rotation_notes = p_rotation_notes,
    rotated_by = auth.uid(),
    updated_at = now()
  WHERE secret_name = p_secret_name;
  
  -- Insert if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO secret_rotation_tracking (secret_name, rotation_notes, rotated_by)
    VALUES (p_secret_name, p_rotation_notes, auth.uid());
  END IF;
  
  -- Log security event
  PERFORM log_security_event(
    'secret_rotated',
    'high',
    'Secret was rotated',
    jsonb_build_object(
      'secret_name', p_secret_name,
      'rotated_by', auth.uid()
    )
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'secret_name', p_secret_name,
    'rotated_at', now()
  );
  
  RETURN v_result;
END;
$function$;

-- Create function to get secrets needing rotation
CREATE OR REPLACE FUNCTION public.get_secrets_needing_rotation()
RETURNS TABLE(
  secret_name TEXT,
  last_rotated_at TIMESTAMP WITH TIME ZONE,
  next_rotation_due TIMESTAMP WITH TIME ZONE,
  days_overdue INTEGER,
  is_critical BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only admins can check rotation status
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  RETURN QUERY
  SELECT 
    srt.secret_name,
    srt.last_rotated_at,
    srt.next_rotation_due,
    EXTRACT(DAY FROM (now() - srt.next_rotation_due))::INTEGER as days_overdue,
    srt.is_critical
  FROM secret_rotation_tracking srt
  WHERE srt.next_rotation_due <= now()
  ORDER BY srt.is_critical DESC, srt.next_rotation_due ASC;
END;
$function$;

-- Insert initial tracking for existing secrets
INSERT INTO secret_rotation_tracking (secret_name, is_critical, rotation_frequency_days) VALUES
  ('STRIPE_SECRET_KEY', true, 90),
  ('PAYPAL_SECRET', true, 90),
  ('PAYPAL_CLIENT_ID', true, 90),
  ('RESEND_API_KEY', false, 180),
  ('INSTAGRAM_CLIENT_SECRET', true, 90),
  ('CRON_SECRET', true, 60),
  ('LOVABLE_API_KEY', false, 180)
ON CONFLICT (secret_name) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_secret_rotation_tracking_updated_at
  BEFORE UPDATE ON public.secret_rotation_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();