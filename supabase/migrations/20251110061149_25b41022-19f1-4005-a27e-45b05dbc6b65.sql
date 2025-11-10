-- Fix security warning: Add search_path to notify_profile_viewed function
CREATE OR REPLACE FUNCTION notify_profile_viewed()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;