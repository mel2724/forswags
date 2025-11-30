-- Add category and metadata columns to athlete_stats
ALTER TABLE athlete_stats
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS unit TEXT,
ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_athlete_stats_category 
ON athlete_stats(athlete_id, category, season);

-- Add comment for documentation
COMMENT ON COLUMN athlete_stats.category IS 'Category of stat: offensive, defensive, physical, academic';
COMMENT ON COLUMN athlete_stats.unit IS 'Unit of measurement: points, yards, seconds, percentage';
COMMENT ON COLUMN athlete_stats.is_highlighted IS 'Whether to highlight this stat on profile';