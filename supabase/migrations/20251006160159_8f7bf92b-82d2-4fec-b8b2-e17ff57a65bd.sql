-- Add email_sent_at field to consent_renewal_notifications table
ALTER TABLE public.consent_renewal_notifications
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;