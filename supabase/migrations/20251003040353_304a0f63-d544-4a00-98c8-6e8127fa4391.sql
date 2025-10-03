-- Add privacy policy acceptance tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS privacy_accepted boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamp with time zone;