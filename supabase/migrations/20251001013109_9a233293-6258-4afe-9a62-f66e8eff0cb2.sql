-- Add social media handle fields to coach_applications table
ALTER TABLE public.coach_applications
ADD COLUMN IF NOT EXISTS twitter_handle text,
ADD COLUMN IF NOT EXISTS instagram_handle text,
ADD COLUMN IF NOT EXISTS facebook_handle text,
ADD COLUMN IF NOT EXISTS tiktok_handle text;