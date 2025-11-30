-- Create athlete of the week table
CREATE TABLE IF NOT EXISTS public.athlete_of_week (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  selection_criteria TEXT NOT NULL,
  selection_rationale TEXT NOT NULL,
  generated_copy TEXT NOT NULL,
  suggested_hashtags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  auto_generated BOOLEAN DEFAULT true,
  UNIQUE(week_start_date)
);

-- Create social media promotion calendar table
CREATE TABLE IF NOT EXISTS public.social_media_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  promotion_type TEXT NOT NULL DEFAULT 'weekly_feature',
  generated_copy TEXT NOT NULL,
  suggested_hashtags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'scheduled',
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(athlete_id, scheduled_date, promotion_type)
);

-- Create athlete promotion tracking table
CREATE TABLE IF NOT EXISTS public.athlete_promotion_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  last_featured_date DATE,
  total_features INTEGER DEFAULT 0,
  last_athlete_of_week DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.athlete_of_week ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_promotion_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for athlete_of_week
CREATE POLICY "Admins can manage athlete of week"
  ON public.athlete_of_week
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view athlete of week"
  ON public.athlete_of_week
  FOR SELECT
  USING (true);

-- RLS Policies for social_media_calendar
CREATE POLICY "Admins can manage social media calendar"
  ON public.social_media_calendar
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view scheduled promotions"
  ON public.social_media_calendar
  FOR SELECT
  USING (true);

-- RLS Policies for athlete_promotion_history
CREATE POLICY "Admins can manage promotion history"
  ON public.athlete_promotion_history
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to get least featured athletes
CREATE OR REPLACE FUNCTION public.get_least_featured_athletes(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  athlete_id UUID,
  full_name TEXT,
  last_featured_date DATE,
  total_features INTEGER,
  days_since_feature INTEGER
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
      ELSE EXTRACT(DAY FROM (CURRENT_DATE - aph.last_featured_date))::INTEGER
    END as days_since_feature
  FROM athletes a
  JOIN profiles p ON p.id = a.user_id
  LEFT JOIN athlete_promotion_history aph ON aph.athlete_id = a.id
  WHERE a.visibility = 'public'
  ORDER BY days_since_feature DESC, total_features ASC
  LIMIT limit_count;
END;
$$;

-- Function to update promotion history
CREATE OR REPLACE FUNCTION public.update_promotion_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO athlete_promotion_history (athlete_id, last_featured_date, total_features, last_athlete_of_week)
  VALUES (
    NEW.athlete_id,
    NEW.week_start_date,
    1,
    NEW.week_start_date
  )
  ON CONFLICT (athlete_id) DO UPDATE
  SET 
    last_featured_date = NEW.week_start_date,
    total_features = athlete_promotion_history.total_features + 1,
    last_athlete_of_week = NEW.week_start_date,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger for athlete of week
CREATE TRIGGER update_athlete_promotion_on_aotw
  AFTER INSERT ON public.athlete_of_week
  FOR EACH ROW
  EXECUTE FUNCTION public.update_promotion_history();

-- Create index for performance
CREATE INDEX idx_athlete_of_week_date ON public.athlete_of_week(week_start_date DESC);
CREATE INDEX idx_social_media_calendar_date ON public.social_media_calendar(scheduled_date);
CREATE INDEX idx_athlete_promotion_history_athlete ON public.athlete_promotion_history(athlete_id);