-- Update RLS policy for athletes table to respect visibility setting
DROP POLICY IF EXISTS "Anyone can view published athlete profiles" ON public.athletes;

CREATE POLICY "Anyone can view public athlete profiles"
  ON public.athletes
  FOR SELECT
  USING (visibility = 'public');

-- Create index for better performance on public profile lookups
CREATE INDEX IF NOT EXISTS idx_athletes_visibility ON public.athletes(visibility);
CREATE INDEX IF NOT EXISTS idx_athletes_id_visibility ON public.athletes(id, visibility) WHERE visibility = 'public';