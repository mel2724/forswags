-- Add policy to allow users to insert their own roles during onboarding
CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add policy to allow users to insert their own membership
CREATE POLICY "Users can insert their own membership"
ON public.memberships
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);