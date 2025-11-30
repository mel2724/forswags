-- Add season column to media_assets table
ALTER TABLE media_assets ADD COLUMN season text;

-- Add index for better filtering by season
CREATE INDEX idx_media_assets_season ON media_assets(athlete_id, season) WHERE season IS NOT NULL;