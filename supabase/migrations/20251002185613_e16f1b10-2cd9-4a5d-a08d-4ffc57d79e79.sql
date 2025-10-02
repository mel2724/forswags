-- Create profile_views table to track who viewed which profile
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_type TEXT NOT NULL CHECK (viewer_type IN ('recruiter', 'coach', 'athlete', 'parent', 'anonymous')),
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_profile_views_athlete_id ON public.profile_views(athlete_id);
CREATE INDEX idx_profile_views_viewer_id ON public.profile_views(viewer_id);
CREATE INDEX idx_profile_views_viewed_at ON public.profile_views(viewed_at DESC);

-- Enable RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Athletes can view who viewed their profile
CREATE POLICY "Athletes can view their profile views"
ON public.profile_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.id = profile_views.athlete_id
    AND athletes.user_id = auth.uid()
  )
);

-- Authenticated users can insert profile views
CREATE POLICY "Authenticated users can insert profile views"
ON public.profile_views
FOR INSERT
WITH CHECK (auth.uid() = viewer_id);

-- Create engagement_metrics table for tracking content engagement
CREATE TABLE IF NOT EXISTS public.engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('profile', 'media', 'social_post', 'highlight')),
  content_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'share', 'download', 'click', 'like')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_engagement_metrics_user_id ON public.engagement_metrics(user_id);
CREATE INDEX idx_engagement_metrics_content ON public.engagement_metrics(content_type, content_id);
CREATE INDEX idx_engagement_metrics_created_at ON public.engagement_metrics(created_at DESC);

-- Enable RLS
ALTER TABLE public.engagement_metrics ENABLE ROW LEVEL SECURITY;

-- Users can view their own engagement metrics
CREATE POLICY "Users can view their own engagement metrics"
ON public.engagement_metrics
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert engagement metrics
CREATE POLICY "Users can insert engagement metrics"
ON public.engagement_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create search_analytics table for recruiter/coach search tracking
CREATE TABLE IF NOT EXISTS public.search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_type TEXT NOT NULL CHECK (search_type IN ('athlete', 'school', 'coach')),
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  results_count INTEGER,
  clicked_result_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_search_analytics_user_id ON public.search_analytics(user_id);
CREATE INDEX idx_search_analytics_created_at ON public.search_analytics(created_at DESC);

-- Enable RLS
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- Users can manage their own search analytics
CREATE POLICY "Users can manage their own search analytics"
ON public.search_analytics
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to get profile view stats
CREATE OR REPLACE FUNCTION public.get_profile_view_stats(p_athlete_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_views BIGINT,
  unique_viewers BIGINT,
  recruiter_views BIGINT,
  coach_views BIGINT,
  recent_views JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_views,
    COUNT(DISTINCT viewer_id)::BIGINT as unique_viewers,
    COUNT(CASE WHEN viewer_type = 'recruiter' THEN 1 END)::BIGINT as recruiter_views,
    COUNT(CASE WHEN viewer_type = 'coach' THEN 1 END)::BIGINT as coach_views,
    jsonb_agg(
      jsonb_build_object(
        'viewer_id', viewer_id,
        'viewer_type', viewer_type,
        'viewed_at', viewed_at
      ) ORDER BY viewed_at DESC
    ) FILTER (WHERE viewed_at >= now() - (p_days || ' days')::interval) as recent_views
  FROM profile_views
  WHERE athlete_id = p_athlete_id
    AND viewed_at >= now() - (p_days || ' days')::interval;
END;
$$;

-- Create function to get engagement metrics
CREATE OR REPLACE FUNCTION public.get_engagement_stats(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_engagements BIGINT,
  views BIGINT,
  shares BIGINT,
  downloads BIGINT,
  engagement_by_type JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_engagements,
    COUNT(CASE WHEN action_type = 'view' THEN 1 END)::BIGINT as views,
    COUNT(CASE WHEN action_type = 'share' THEN 1 END)::BIGINT as shares,
    COUNT(CASE WHEN action_type = 'download' THEN 1 END)::BIGINT as downloads,
    jsonb_object_agg(
      content_type,
      COUNT(*)
    ) as engagement_by_type
  FROM engagement_metrics
  WHERE user_id = p_user_id
    AND created_at >= now() - (p_days || ' days')::interval
  GROUP BY user_id;
END;
$$;