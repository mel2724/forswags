-- Add unique constraint on athlete_id to allow upsert operations
ALTER TABLE college_recommendations 
ADD CONSTRAINT college_recommendations_athlete_id_key UNIQUE (athlete_id);