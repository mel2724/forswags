-- Fix search path security issue for composite score function
CREATE OR REPLACE FUNCTION get_evaluation_composite_score(eval_scores jsonb)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  total numeric := 0;
  count integer := 0;
  key text;
  value numeric;
BEGIN
  FOR key, value IN SELECT * FROM jsonb_each_text(eval_scores)
  LOOP
    total := total + value::numeric;
    count := count + 1;
  END LOOP;
  
  IF count > 0 THEN
    RETURN total / count;
  ELSE
    RETURN 0;
  END IF;
END;
$$;