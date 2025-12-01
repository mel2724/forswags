-- Add unique constraint on athlete_id in athlete_promotion_history table
ALTER TABLE athlete_promotion_history 
ADD CONSTRAINT athlete_promotion_history_athlete_id_key UNIQUE (athlete_id);