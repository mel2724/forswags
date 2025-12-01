-- Add unique constraint to rankings table for proper upsert behavior
-- This allows the merge-rankings function to update existing rankings

ALTER TABLE rankings 
ADD CONSTRAINT rankings_athlete_id_unique 
UNIQUE (athlete_id);