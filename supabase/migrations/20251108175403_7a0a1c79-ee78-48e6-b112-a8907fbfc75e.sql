-- Create table for tracking Playbook for Life video views
CREATE TABLE IF NOT EXISTS playbook_video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  watch_duration_seconds INTEGER,
  completed BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_playbook_video_views_lesson_id ON playbook_video_views(lesson_id);
CREATE INDEX idx_playbook_video_views_user_id ON playbook_video_views(user_id);
CREATE INDEX idx_playbook_video_views_viewed_at ON playbook_video_views(viewed_at DESC);

-- Enable RLS
ALTER TABLE playbook_video_views ENABLE ROW LEVEL SECURITY;

-- Admins can view all video views
CREATE POLICY "Admins can view all video views"
ON playbook_video_views FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Users can view their own video views
CREATE POLICY "Users can view their own video views"
ON playbook_video_views FOR SELECT
USING (auth.uid() = user_id);

-- Anyone can insert video views (for tracking)
CREATE POLICY "Anyone can track video views"
ON playbook_video_views FOR INSERT
WITH CHECK (true);

-- Create a view for video analytics
CREATE OR REPLACE VIEW playbook_video_analytics AS
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

-- Add view count column to lessons table for quick reference
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_video_view_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE lessons
  SET view_count = view_count + 1
  WHERE id = NEW.lesson_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-increment view count
CREATE TRIGGER trigger_increment_video_view_count
AFTER INSERT ON playbook_video_views
FOR EACH ROW
EXECUTE FUNCTION increment_video_view_count();