-- Add profile claim fields to athletes table
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS profile_claimed BOOLEAN DEFAULT false;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS claim_token TEXT UNIQUE;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS claim_token_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS is_imported BOOLEAN DEFAULT false;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS import_batch_id TEXT;

-- Add index for faster claim token lookup
CREATE INDEX IF NOT EXISTS idx_athletes_claim_token ON athletes(claim_token) WHERE claim_token IS NOT NULL;

-- Function to check for duplicate athletes
CREATE OR REPLACE FUNCTION check_duplicate_athlete(
  p_full_name TEXT,
  p_graduation_year INTEGER,
  p_sport TEXT,
  p_high_school TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_athlete_id UUID;
BEGIN
  -- Check for exact match on name, grad year, and sport
  SELECT a.id INTO v_athlete_id
  FROM athletes a
  JOIN profiles p ON p.id = a.user_id
  WHERE LOWER(p.full_name) = LOWER(p_full_name)
    AND a.graduation_year = p_graduation_year
    AND LOWER(a.sport) = LOWER(p_sport)
    AND (p_high_school IS NULL OR LOWER(a.high_school) = LOWER(p_high_school))
  LIMIT 1;
  
  RETURN v_athlete_id;
END;
$$;

-- Function to generate claim token
CREATE OR REPLACE FUNCTION generate_claim_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;