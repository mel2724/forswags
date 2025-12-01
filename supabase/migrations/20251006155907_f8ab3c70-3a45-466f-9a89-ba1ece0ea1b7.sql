-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to check and notify expiring consents (30 days before expiration)
CREATE OR REPLACE FUNCTION public.notify_expiring_consents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expiring_record RECORD;
BEGIN
  -- Find all minors with consent expiring in 30 days
  FOR expiring_record IN
    SELECT 
      a.id,
      a.user_id,
      a.parent_email,
      a.consent_expires_at,
      p.full_name,
      p.email
    FROM athletes a
    JOIN profiles p ON p.id = a.user_id
    WHERE a.is_minor(a.date_of_birth) = true
      AND a.public_profile_consent = true
      AND a.consent_expires_at IS NOT NULL
      AND a.consent_expires_at BETWEEN now() AND (now() + INTERVAL '30 days')
      AND NOT EXISTS (
        SELECT 1 FROM consent_renewal_notifications
        WHERE athlete_id = a.id 
          AND sent_at > (now() - INTERVAL '45 days')
      )
  LOOP
    -- Insert notification record
    INSERT INTO consent_renewal_notifications (
      athlete_id,
      parent_email,
      expires_at,
      notification_type
    ) VALUES (
      expiring_record.id,
      expiring_record.parent_email,
      expiring_record.consent_expires_at,
      'expiring_soon'
    );
    
    -- Log the notification
    PERFORM log_audit_event(
      'consent_renewal_notification_sent',
      'athletes',
      expiring_record.id,
      jsonb_build_object(
        'parent_email', expiring_record.parent_email,
        'expires_at', expiring_record.consent_expires_at,
        'days_until_expiration', EXTRACT(DAY FROM (expiring_record.consent_expires_at - now()))
      )
    );
  END LOOP;
END;
$$;

-- Create table to track consent renewal notifications
CREATE TABLE IF NOT EXISTS public.consent_renewal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  parent_email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notification_type TEXT NOT NULL, -- 'expiring_soon', 'expired', 'renewed'
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consent_renewal_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all consent notifications"
ON public.consent_renewal_notifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert consent notifications"
ON public.consent_renewal_notifications
FOR INSERT
WITH CHECK (true);

-- Schedule daily check at 9 AM UTC
SELECT cron.schedule(
  'check-expiring-consents-daily',
  '0 9 * * *', -- Every day at 9 AM UTC
  $$
  SELECT public.notify_expiring_consents();
  $$
);

-- Schedule expired consent enforcement daily at 10 AM UTC
SELECT cron.schedule(
  'enforce-expired-consents-daily',
  '0 10 * * *', -- Every day at 10 AM UTC
  $$
  SELECT public.check_expired_consents();
  $$
);

-- Insert email template for consent renewal reminder
INSERT INTO public.email_templates (
  template_key,
  subject,
  content,
  description,
  available_variables
) VALUES (
  'consent_renewal_reminder',
  'Annual Consent Renewal Required - {{athlete_name}}',
  '<h2>Annual Consent Renewal Required</h2>
<p>Dear Parent/Guardian,</p>
<p>This is a reminder that the annual consent for <strong>{{athlete_name}}</strong>''s public profile will expire on <strong>{{expiration_date}}</strong>.</p>
<p>To maintain your child''s public profile visibility and continue receiving recruitment opportunities, you must renew consent annually as required by COPPA regulations.</p>
<h3>What You Need to Do:</h3>
<ol>
  <li>Log in to your ForSWAGs account</li>
  <li>Navigate to your athlete''s profile settings</li>
  <li>Review and renew the consent agreement</li>
</ol>
<p><strong>Important:</strong> If consent is not renewed by {{expiration_date}}, the profile will automatically be set to private and will no longer be visible to college recruiters.</p>
<p><a href="{{renewal_link}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Renew Consent Now</a></p>
<p>If you have any questions, please contact our support team.</p>
<p>Best regards,<br>The ForSWAGs Team</p>',
  'Sent 30 days before consent expiration for minors',
  '["athlete_name", "expiration_date", "renewal_link"]'::jsonb
) ON CONFLICT (template_key) DO UPDATE SET
  content = EXCLUDED.content,
  subject = EXCLUDED.subject,
  available_variables = EXCLUDED.available_variables;

-- Insert email template for expired consent notification
INSERT INTO public.email_templates (
  template_key,
  subject,
  content,
  description,
  available_variables
) VALUES (
  'consent_expired',
  'Profile Set to Private - Consent Expired for {{athlete_name}}',
  '<h2>Profile Privacy Update</h2>
<p>Dear Parent/Guardian,</p>
<p>The annual consent for <strong>{{athlete_name}}</strong>''s public profile has expired as of <strong>{{expiration_date}}</strong>.</p>
<p><strong>Action Taken:</strong> In compliance with COPPA regulations, we have automatically:</p>
<ul>
  <li>Set the profile to <strong>private</strong></li>
  <li>Removed profile visibility to college recruiters</li>
  <li>Disabled public profile consent</li>
</ul>
<h3>To Restore Public Visibility:</h3>
<ol>
  <li>Log in to your ForSWAGs account</li>
  <li>Navigate to your athlete''s profile settings</li>
  <li>Review and provide renewed consent</li>
</ol>
<p><a href="{{renewal_link}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Renew Consent</a></p>
<p>Your athlete''s data remains secure and can be restored to public visibility once consent is renewed.</p>
<p>Best regards,<br>The ForSWAGs Team</p>',
  'Sent when consent expires and profile is set to private',
  '["athlete_name", "expiration_date", "renewal_link"]'::jsonb
) ON CONFLICT (template_key) DO UPDATE SET
  content = EXCLUDED.content,
  subject = EXCLUDED.subject,
  available_variables = EXCLUDED.available_variables;