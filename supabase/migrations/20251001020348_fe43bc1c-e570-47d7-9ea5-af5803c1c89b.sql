-- Add fields to track re-evaluations and coach assignment
ALTER TABLE evaluations 
ADD COLUMN is_reevaluation BOOLEAN DEFAULT false,
ADD COLUMN previous_evaluation_id UUID REFERENCES evaluations(id),
ADD COLUMN requested_coach_id UUID REFERENCES coach_profiles(user_id),
ADD COLUMN admin_assigned BOOLEAN DEFAULT false,
ADD COLUMN last_evaluation_date TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX idx_evaluations_athlete_completed ON evaluations(athlete_id, completed_at) WHERE completed_at IS NOT NULL;

-- Create function to check if athlete can request re-evaluation (2 months since last)
CREATE OR REPLACE FUNCTION can_request_reevaluation(p_athlete_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_eval_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT MAX(completed_at) INTO last_eval_date
  FROM evaluations
  WHERE athlete_id = p_athlete_id
    AND status = 'completed';
  
  IF last_eval_date IS NULL THEN
    RETURN true;
  END IF;
  
  RETURN (CURRENT_TIMESTAMP - last_eval_date) >= INTERVAL '2 months';
END;
$$;

-- Create function to get pricing for athlete (checks if within 1 year)
CREATE OR REPLACE FUNCTION get_evaluation_price(p_athlete_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_purchase_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT MAX(purchased_at) INTO last_purchase_date
  FROM evaluations
  WHERE athlete_id = p_athlete_id;
  
  IF last_purchase_date IS NULL THEN
    RETURN 'initial'; -- $97
  END IF;
  
  IF (CURRENT_TIMESTAMP - last_purchase_date) <= INTERVAL '1 year' THEN
    RETURN 'reevaluation'; -- $49
  ELSE
    RETURN 'initial'; -- $97
  END IF;
END;
$$;