-- Create a function to notify when a recruiter views a profile
CREATE OR REPLACE FUNCTION notify_profile_viewed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for recruiter views
  IF NEW.viewer_type = 'recruiter' THEN
    -- Call the edge function asynchronously using pg_net
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/notify-profile-viewed',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'profile_view_id', NEW.id,
        'athlete_id', NEW.athlete_id,
        'viewer_id', NEW.viewer_id,
        'viewer_type', NEW.viewer_type
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profile_views
DROP TRIGGER IF EXISTS profile_viewed_notification ON profile_views;
CREATE TRIGGER profile_viewed_notification
  AFTER INSERT ON profile_views
  FOR EACH ROW
  EXECUTE FUNCTION notify_profile_viewed();

-- Add notification preferences to profiles table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' 
                 AND column_name = 'notify_on_profile_views') THEN
    ALTER TABLE profiles ADD COLUMN notify_on_profile_views BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA net TO postgres, anon, authenticated, service_role;