-- Make athlete_id nullable to support external-only rankings
ALTER TABLE rankings ALTER COLUMN athlete_id DROP NOT NULL;

-- Add columns for external-only rankings
ALTER TABLE rankings 
ADD COLUMN IF NOT EXISTS external_athlete_name TEXT,
ADD COLUMN IF NOT EXISTS is_external_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sport TEXT,
ADD COLUMN IF NOT EXISTS graduation_year INTEGER;

-- Add indexes for querying
CREATE INDEX IF NOT EXISTS idx_rankings_is_external_only ON rankings(is_external_only);
CREATE INDEX IF NOT EXISTS idx_rankings_sport_grad_year ON rankings(sport, graduation_year) WHERE sport IS NOT NULL;