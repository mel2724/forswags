-- Add RLS policy for parents to view their own verification requests
CREATE POLICY "Parents can view verifications for their email"
ON parent_verifications
FOR SELECT
USING (
  LOWER(parent_email) = LOWER(auth.jwt()->>'email')
);