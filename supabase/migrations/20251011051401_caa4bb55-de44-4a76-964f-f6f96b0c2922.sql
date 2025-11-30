-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Grant usage on cron schema to postgres
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule Prime Dime notification job to run every 6 hours
SELECT cron.schedule(
  'notify-prime-dime-ready-job',
  '0 */6 * * *', -- Every 6 hours
  $$
  SELECT
    net.http_post(
        url:='https://fejnevxardxejdvjbipc.supabase.co/functions/v1/notify-prime-dime-ready',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlam5ldnhhcmR4ZWpkdmpiaXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjQyOTQsImV4cCI6MjA3NDc0MDI5NH0.J_50aQGhUNGZu27lkTmjmoZwBQljw6eR_7DLIQ7rJiE"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);