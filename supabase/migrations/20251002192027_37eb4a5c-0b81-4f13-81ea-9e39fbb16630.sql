-- Add username field to athletes table for memorable profile URLs
ALTER TABLE public.athletes 
ADD COLUMN username text UNIQUE;

-- Create index for username lookups
CREATE INDEX idx_athletes_username ON public.athletes(username);

-- Add constraint to ensure username format (lowercase, alphanumeric, hyphens only)
ALTER TABLE public.athletes 
ADD CONSTRAINT username_format CHECK (username ~* '^[a-z0-9-]+$');

-- Update RLS policy to allow lookup by username
DROP POLICY IF EXISTS "Anyone can view public athlete profiles" ON public.athletes;

CREATE POLICY "Anyone can view public athlete profiles"
  ON public.athletes
  FOR SELECT
  USING (visibility = 'public');