-- Allow public to view basic profile info for athletes with public profiles
CREATE POLICY "Public can view profiles for public athletes"
ON public.profiles
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.user_id = profiles.id
    AND athletes.visibility = 'public'
    AND athletes.public_profile_consent = true
    AND (
      is_minor(athletes.date_of_birth) = false
      OR (is_minor(athletes.date_of_birth) = true AND athletes.is_parent_verified = true)
    )
  )
);