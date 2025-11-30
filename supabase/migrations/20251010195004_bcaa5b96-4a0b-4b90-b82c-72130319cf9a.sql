-- Create table for contact form rate limiting
CREATE TABLE IF NOT EXISTS public.contact_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  email TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  success BOOLEAN DEFAULT true
);

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_contact_submissions_ip_time 
ON public.contact_form_submissions(ip_address, submitted_at DESC);

-- Enable RLS
ALTER TABLE public.contact_form_submissions ENABLE ROW LEVEL SECURITY;

-- Only system can insert (edge functions)
CREATE POLICY "System can insert contact submissions"
ON public.contact_form_submissions
FOR INSERT
WITH CHECK (true);

-- Admins can view all submissions
CREATE POLICY "Admins can view contact submissions"
ON public.contact_form_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Auto-delete old entries (older than 7 days) to keep table clean
CREATE OR REPLACE FUNCTION clean_old_contact_submissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM contact_form_submissions
  WHERE submitted_at < NOW() - INTERVAL '7 days';
END;
$$;