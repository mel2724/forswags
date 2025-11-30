-- Add physical measurements columns to external_rankings table
ALTER TABLE external_rankings 
ADD COLUMN IF NOT EXISTS height_feet INTEGER,
ADD COLUMN IF NOT EXISTS height_inches INTEGER,
ADD COLUMN IF NOT EXISTS weight INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN external_rankings.height_feet IS 'Athlete height in feet (e.g., 6 for 6''2")';
COMMENT ON COLUMN external_rankings.height_inches IS 'Athlete height in inches (e.g., 2 for 6''2")';
COMMENT ON COLUMN external_rankings.weight IS 'Athlete weight in pounds';