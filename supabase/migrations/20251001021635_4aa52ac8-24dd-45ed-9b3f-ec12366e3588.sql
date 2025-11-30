-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the check-stale-evaluations function to run every hour
SELECT cron.schedule(
  'check-stale-evaluations-hourly',
  '0 * * * *', -- Run at the start of every hour
  $$
  SELECT
    net.http_post(
      url:='https://fejnevxardxejdvjbipc.supabase.co/functions/v1/check-stale-evaluations',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlam5ldnhhcmR4ZWpkdmpiaXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjQyOTQsImV4cCI6MjA3NDc0MDI5NH0.J_50aQGhUNGZu27lkTmjmoZwBQljw6eR_7DLIQ7rJiE"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);