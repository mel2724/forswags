-- Add column to track when analysis was requested
ALTER TABLE athletes
ADD COLUMN IF NOT EXISTS analysis_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS analysis_notified_at TIMESTAMP WITH TIME ZONE;

-- Add column to college_matches to track when matches were generated
ALTER TABLE college_matches
ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

COMMENT ON COLUMN athletes.analysis_requested_at IS 'When the athlete requested college match analysis';
COMMENT ON COLUMN athletes.analysis_notified_at IS 'When the athlete was notified that their Prime Dime matches are ready';
COMMENT ON COLUMN college_matches.generated_at IS 'When these matches were generated';