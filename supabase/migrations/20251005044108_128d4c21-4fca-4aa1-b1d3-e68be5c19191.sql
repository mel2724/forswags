-- Fix the is_minor function - use IMMUTABLE (not STABLE) since age() is deterministic
CREATE OR REPLACE FUNCTION public.is_minor(p_date_of_birth date)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT EXTRACT(YEAR FROM age(p_date_of_birth)) < 18;
$$;