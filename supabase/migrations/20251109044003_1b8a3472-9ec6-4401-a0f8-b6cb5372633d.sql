-- Fix Tyler Brown's parent verification record
-- Update the verification record with NULL athlete_id to link it to Tyler Brown

DO $$
DECLARE
  v_verification_id UUID := '176fb819-8e78-4f21-8933-596fb85c4016';
  v_athlete_id UUID := 'dc611cb4-02eb-4f02-a9ad-d4e8d32f4192';
  v_parent_email TEXT := 'mel2724@gmail.com';
BEGIN
  -- Update the verification record with the athlete_id
  UPDATE parent_verifications
  SET athlete_id = v_athlete_id
  WHERE id = v_verification_id;

  -- Update Tyler Brown's athlete record with parent verification data
  UPDATE athletes
  SET 
    parent_email = v_parent_email,
    is_parent_verified = true,
    parent_verified_at = now(),
    consent_expires_at = now() + INTERVAL '1 year',
    visibility = 'public',
    public_profile_consent = true
  WHERE id = v_athlete_id;

  -- Log the fix
  INSERT INTO audit_logs (action, resource_type, resource_id, metadata)
  VALUES (
    'parent_verification_fixed',
    'athletes',
    v_athlete_id,
    jsonb_build_object(
      'verification_id', v_verification_id,
      'parent_email', v_parent_email,
      'fixed_at', now(),
      'reason', 'Manual fix for NULL athlete_id in verification record'
    )
  );
END $$;

-- Create a helper function to auto-link verifications when athlete record is created
CREATE OR REPLACE FUNCTION link_pending_parent_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new athlete record is created, check if there's a pending verification
  -- with the same user_id but NULL athlete_id
  UPDATE parent_verifications
  SET athlete_id = NEW.id
  WHERE user_id = NEW.user_id
    AND athlete_id IS NULL
    AND verified_at IS NULL
    AND expires_at > now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically link verifications when athlete is created
DROP TRIGGER IF EXISTS auto_link_parent_verification ON athletes;
CREATE TRIGGER auto_link_parent_verification
  AFTER INSERT ON athletes
  FOR EACH ROW
  EXECUTE FUNCTION link_pending_parent_verification();

-- Add comment explaining the function
COMMENT ON FUNCTION link_pending_parent_verification() IS 
  'Automatically links pending parent verifications to athlete records when created. 
   This handles the race condition where verification is sent during onboarding 
   before the athlete profile is fully created.';