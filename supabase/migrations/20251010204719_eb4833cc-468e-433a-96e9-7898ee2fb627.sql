-- Drop the insecure policy that allows anyone to view all stats
DROP POLICY IF EXISTS "Anyone can view athlete stats" ON athlete_stats;

-- Create a secure policy that respects athlete privacy settings
CREATE POLICY "Public can view stats for visible athletes"
ON athlete_stats
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM athletes a
    WHERE a.id = athlete_stats.athlete_id
      AND a.visibility = 'public'
      AND a.public_profile_consent = true
      AND (
        -- Adult athletes with consent
        (is_minor(a.date_of_birth) = false)
        OR 
        -- Minor athletes with verified parent consent
        ((is_minor(a.date_of_birth) = true) AND (a.is_parent_verified = true))
      )
  )
);

-- Athletes can always view their own stats
CREATE POLICY "Athletes can view own stats"
ON athlete_stats
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.id = athlete_stats.athlete_id
      AND athletes.user_id = auth.uid()
  )
);

-- Paid recruiters can view stats for public athletes
CREATE POLICY "Recruiters can view stats for accessible athletes"
ON athlete_stats
FOR SELECT
USING (
  is_paid_recruiter(auth.uid())
  AND EXISTS (
    SELECT 1 FROM athletes a
    WHERE a.id = athlete_stats.athlete_id
      AND a.visibility = 'public'
      AND a.public_profile_consent = true
      AND (
        (is_minor(a.date_of_birth) = false)
        OR 
        ((is_minor(a.date_of_birth) = true) AND (a.is_parent_verified = true))
      )
  )
);

-- Parents can view their children's stats
CREATE POLICY "Parents can view children stats"
ON athlete_stats
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.id = athlete_stats.athlete_id
      AND athletes.parent_id = auth.uid()
  )
);