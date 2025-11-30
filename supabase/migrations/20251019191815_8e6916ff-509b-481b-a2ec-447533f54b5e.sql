-- Add user_id to parent_verifications table and make athlete_id nullable
ALTER TABLE parent_verifications 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ALTER COLUMN athlete_id DROP NOT NULL;

-- Add index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_parent_verifications_user_id ON parent_verifications(user_id);

-- Update RLS policies to allow insertion with user_id during onboarding
DROP POLICY IF EXISTS "Users can insert their own parent verifications" ON parent_verifications;
CREATE POLICY "Users can insert their own parent verifications" 
  ON parent_verifications 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);