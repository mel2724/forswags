-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule send-renewal-reminders to run daily at 9 AM UTC
SELECT cron.schedule(
  'send-renewal-reminders-daily',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://fejnevxardxejdvjbipc.supabase.co/functions/v1/send-renewal-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlam5ldnhhcmR4ZWpkdmpiaXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjQyOTQsImV4cCI6MjA3NDc0MDI5NH0.J_50aQGhUNGZu27lkTmjmoZwBQljw6eR_7DLIQ7rJiE"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);