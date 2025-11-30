-- Add unique constraint to external_rankings table for proper upsert behavior
-- This allows ON CONFLICT to work when inserting scraped data

ALTER TABLE external_rankings 
ADD CONSTRAINT external_rankings_unique_entry 
UNIQUE (source, athlete_name, sport, graduation_year);