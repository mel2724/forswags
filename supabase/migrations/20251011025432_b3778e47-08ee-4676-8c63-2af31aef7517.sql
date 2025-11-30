-- Add columns to track athlete-to-alumni conversion
ALTER TABLE athletes 
ADD COLUMN IF NOT EXISTS converted_to_alumni BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP WITH TIME ZONE;

-- Add alumni role to enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('admin', 'athlete', 'parent', 'coach', 'recruiter', 'alumni');
  ELSE
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'alumni';
  END IF;
END $$;

-- Create index for efficient querying of graduates
CREATE INDEX IF NOT EXISTS idx_athletes_graduation_conversion 
ON athletes(graduation_year, converted_to_alumni) 
WHERE converted_to_alumni IS NULL OR converted_to_alumni = false;

-- Schedule the transition function to run on August 15th at 2 AM every year
-- This gives time after most graduations but before fall semester
SELECT cron.schedule(
  'transition-graduates-to-alumni',
  '0 2 15 8 *', -- At 2:00 AM on the 15th of August every year
  $$
  SELECT
    net.http_post(
        url:='https://fejnevxardxejdvjbipc.supabase.co/functions/v1/transition-graduates-to-alumni',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlam5ldnhhcmR4ZWpkdmpiaXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjQyOTQsImV4cCI6MjA3NDc0MDI5NH0.J_50aQGhUNGZu27lkTmjmoZwBQljw6eR_7DLIQ7rJiE"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);