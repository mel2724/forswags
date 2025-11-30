-- Add fields for the 22-question diagnostic to college_match_prefs table
ALTER TABLE college_match_prefs
ADD COLUMN IF NOT EXISTS sport VARCHAR,
ADD COLUMN IF NOT EXISTS position VARCHAR,
ADD COLUMN IF NOT EXISTS competition_level VARCHAR,
ADD COLUMN IF NOT EXISTS current_stats TEXT,
ADD COLUMN IF NOT EXISTS playing_time_preference VARCHAR,
ADD COLUMN IF NOT EXISTS athletic_scholarships_important BOOLEAN,
ADD COLUMN IF NOT EXISTS current_gpa DECIMAL,
ADD COLUMN IF NOT EXISTS test_scores VARCHAR,
ADD COLUMN IF NOT EXISTS major_interests TEXT,
ADD COLUMN IF NOT EXISTS academic_support_needed BOOLEAN,
ADD COLUMN IF NOT EXISTS school_focus_preference VARCHAR,
ADD COLUMN IF NOT EXISTS financial_aid_needed BOOLEAN,
ADD COLUMN IF NOT EXISTS fafsa_eligible BOOLEAN,
ADD COLUMN IF NOT EXISTS consider_private_schools BOOLEAN,
ADD COLUMN IF NOT EXISTS willing_to_work BOOLEAN,
ADD COLUMN IF NOT EXISTS location_preference VARCHAR,
ADD COLUMN IF NOT EXISTS campus_setting_preference VARCHAR,
ADD COLUMN IF NOT EXISTS school_size_preference VARCHAR,
ADD COLUMN IF NOT EXISTS weather_preference VARCHAR,
ADD COLUMN IF NOT EXISTS faith_based_preference BOOLEAN,
ADD COLUMN IF NOT EXISTS campus_culture_important BOOLEAN,
ADD COLUMN IF NOT EXISTS prestige_important BOOLEAN,
ADD COLUMN IF NOT EXISTS backup_career_plan TEXT,
ADD COLUMN IF NOT EXISTS conversation_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS conversation_data JSONB;

-- Create table for storing AI-generated college recommendations
CREATE TABLE IF NOT EXISTS college_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  recommendations JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE college_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS policies for college_recommendations
CREATE POLICY "Users can view their own recommendations"
  ON college_recommendations FOR SELECT
  USING (
    athlete_id IN (
      SELECT id FROM athletes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own recommendations"
  ON college_recommendations FOR INSERT
  WITH CHECK (
    athlete_id IN (
      SELECT id FROM athletes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own recommendations"
  ON college_recommendations FOR UPDATE
  USING (
    athlete_id IN (
      SELECT id FROM athletes WHERE user_id = auth.uid()
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_college_recommendations_athlete_id ON college_recommendations(athlete_id);