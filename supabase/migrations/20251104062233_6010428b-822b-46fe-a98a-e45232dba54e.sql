-- Add analytics tracking fields to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS viewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS clicked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS campaign_id text;

-- Create notification analytics summary table for campaign tracking
CREATE TABLE IF NOT EXISTS notification_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id text UNIQUE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  link text,
  target_user_types text[] NOT NULL,
  sent_count integer DEFAULT 0,
  viewed_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  sent_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on notification_campaigns
ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;

-- Admins can manage campaigns
CREATE POLICY "Admins can manage notification campaigns"
  ON notification_campaigns
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_campaign ON notifications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_notifications_viewed ON notifications(viewed_at);
CREATE INDEX IF NOT EXISTS idx_notifications_clicked ON notifications(clicked_at);
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_sent_at ON notification_campaigns(sent_at DESC);