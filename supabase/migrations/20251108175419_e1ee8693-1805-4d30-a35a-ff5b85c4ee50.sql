-- Drop and recreate the view without security definer
DROP VIEW IF EXISTS playbook_video_analytics;

CREATE VIEW playbook_video_analytics 
WITH (security_invoker = true)
AS
SELECT 
  l.id as lesson_id,
  l.title as video_title,
  m.title as topic_title,
  COUNT(DISTINCT pvv.id) as total_views,
  COUNT(DISTINCT pvv.user_id) as unique_viewers,
  COUNT(DISTINCT pvv.id) FILTER (WHERE pvv.completed = true) as completed_views,
  AVG(pvv.watch_duration_seconds) as avg_watch_duration,
  COUNT(DISTINCT pvv.id) FILTER (WHERE pvv.viewed_at >= now() - interval '7 days') as views_last_7_days,
  COUNT(DISTINCT pvv.id) FILTER (WHERE pvv.viewed_at >= now() - interval '30 days') as views_last_30_days,
  MAX(pvv.viewed_at) as last_viewed_at
FROM lessons l
JOIN modules m ON m.id = l.module_id
LEFT JOIN playbook_video_views pvv ON pvv.lesson_id = l.id
WHERE l.video_url IS NOT NULL
GROUP BY l.id, l.title, m.title;

-- Grant access to the view
GRANT SELECT ON playbook_video_analytics TO authenticated;