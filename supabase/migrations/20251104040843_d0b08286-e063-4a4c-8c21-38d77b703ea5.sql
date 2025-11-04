-- Fix the get_least_featured_athletes function
DROP FUNCTION IF EXISTS get_least_featured_athletes(integer);

CREATE OR REPLACE FUNCTION get_least_featured_athletes(limit_count integer DEFAULT 10)
RETURNS TABLE(
  athlete_id uuid, 
  full_name text, 
  last_featured_date date, 
  total_features integer, 
  days_since_feature integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as athlete_id,
    p.full_name,
    aph.last_featured_date,
    COALESCE(aph.total_features, 0) as total_features,
    CASE 
      WHEN aph.last_featured_date IS NULL THEN 999999
      ELSE (CURRENT_DATE - aph.last_featured_date)::INTEGER
    END as days_since_feature
  FROM athletes a
  JOIN profiles p ON p.id = a.user_id
  LEFT JOIN athlete_promotion_history aph ON aph.athlete_id = a.id
  WHERE a.visibility = 'public'
  ORDER BY days_since_feature DESC, total_features ASC
  LIMIT limit_count;
END;
$$;