-- Add Hudl and MaxPreps profile URL columns to athletes table
ALTER TABLE athletes
ADD COLUMN IF NOT EXISTS hudl_profile_url TEXT,
ADD COLUMN IF NOT EXISTS maxpreps_profile_url TEXT;

-- Create table to track stat update reminders
CREATE TABLE IF NOT EXISTS stat_update_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_frequency_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on stat_update_reminders
ALTER TABLE stat_update_reminders ENABLE ROW LEVEL SECURITY;

-- Athletes can view their own reminders
CREATE POLICY "Athletes can view their own reminders"
ON stat_update_reminders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.id = stat_update_reminders.athlete_id
      AND athletes.user_id = auth.uid()
  )
);

-- Athletes can manage their own reminders
CREATE POLICY "Athletes can manage their own reminders"
ON stat_update_reminders
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.id = stat_update_reminders.athlete_id
      AND athletes.user_id = auth.uid()
  )
);

-- Create function to check for athletes needing stat update reminders
CREATE OR REPLACE FUNCTION check_stat_update_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reminder_record RECORD;
BEGIN
  FOR reminder_record IN
    SELECT 
      sur.id,
      sur.athlete_id,
      a.user_id,
      p.full_name,
      p.email
    FROM stat_update_reminders sur
    JOIN athletes a ON a.id = sur.athlete_id
    JOIN profiles p ON p.id = a.user_id
    WHERE sur.is_active = true
      AND (
        sur.last_reminder_sent_at IS NULL 
        OR sur.last_reminder_sent_at < (now() - (sur.reminder_frequency_days || ' days')::interval)
      )
  LOOP
    -- Insert notification
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      link
    ) VALUES (
      reminder_record.user_id,
      'Time to Update Your Stats! 📊',
      'Keep your profile competitive by updating your latest performance stats. Colleges check profiles regularly!',
      'reminder',
      '/stats'
    );
    
    -- Update last reminder sent timestamp
    UPDATE stat_update_reminders
    SET last_reminder_sent_at = now()
    WHERE id = reminder_record.id;
  END LOOP;
END;
$$;