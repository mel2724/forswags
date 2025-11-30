-- Create email engagement tracking table
CREATE TABLE IF NOT EXISTS public.email_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_email_id UUID NOT NULL REFERENCES public.scheduled_emails(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('open', 'click')),
  clicked_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX idx_email_engagement_scheduled_email ON public.email_engagement(scheduled_email_id);
CREATE INDEX idx_email_engagement_event_type ON public.email_engagement(event_type);
CREATE INDEX idx_email_engagement_recipient ON public.email_engagement(recipient_email);

-- Add RLS policies
ALTER TABLE public.email_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all engagement"
  ON public.email_engagement
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert engagement events"
  ON public.email_engagement
  FOR INSERT
  WITH CHECK (true);

-- Add analytics columns to scheduled_emails
ALTER TABLE public.scheduled_emails
ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unique_opens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unique_clicks INTEGER DEFAULT 0;