-- Add display_order column to media_assets table
ALTER TABLE media_assets ADD COLUMN display_order integer DEFAULT 0;

-- Update existing records to have sequential order based on created_at
UPDATE media_assets 
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY athlete_id, media_type ORDER BY created_at) as row_num
  FROM media_assets
) AS subquery
WHERE media_assets.id = subquery.id;

-- Create index for better performance when ordering
CREATE INDEX idx_media_assets_display_order ON media_assets(athlete_id, media_type, display_order);