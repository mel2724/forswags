-- Fix get_engagement_stats to handle empty result sets
-- The jsonb_object_agg function fails when there are no rows
DROP FUNCTION IF EXISTS public.get_engagement_stats(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_engagement_stats(p_user_id uuid, p_days integer DEFAULT 30)
 RETURNS TABLE(total_engagements bigint, views bigint, shares bigint, downloads bigint, engagement_by_type jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH engagement_data AS (
    SELECT
      COUNT(*)::BIGINT as total_engagements,
      COUNT(CASE WHEN action_type = 'view' THEN 1 END)::BIGINT as views,
      COUNT(CASE WHEN action_type = 'share' THEN 1 END)::BIGINT as shares,
      COUNT(CASE WHEN action_type = 'download' THEN 1 END)::BIGINT as downloads,
      CASE 
        WHEN COUNT(*) > 0 THEN jsonb_object_agg(content_type, COUNT(*))
        ELSE '{}'::jsonb
      END as engagement_by_type
    FROM engagement_metrics
    WHERE user_id = p_user_id
      AND created_at >= now() - (p_days || ' days')::interval
    GROUP BY user_id
  )
  SELECT 
    COALESCE(total_engagements, 0),
    COALESCE(views, 0),
    COALESCE(shares, 0),
    COALESCE(downloads, 0),
    COALESCE(engagement_by_type, '{}'::jsonb)
  FROM engagement_data
  UNION ALL
  SELECT 0::bigint, 0::bigint, 0::bigint, 0::bigint, '{}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM engagement_data)
  LIMIT 1;
END;
$function$;