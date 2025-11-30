-- Drop the recursive RLS policy that causes infinite loops
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Keep only the self-access policy which is sufficient
-- This policy already exists: "Users can view own roles" with (auth.uid() = user_id)

-- Verify the has_role function works correctly
-- The function is SECURITY DEFINER so it bypasses RLS when called
-- This breaks the recursion cycle