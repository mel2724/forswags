-- Phase 1: Enhanced Rankings System Database Schema

-- 1. Create external_rankings table to store scraped data
CREATE TABLE IF NOT EXISTS public.external_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('maxpreps', '247sports', 'espn')),
  external_athlete_id TEXT,
  athlete_name TEXT NOT NULL,
  sport TEXT NOT NULL,
  position TEXT,
  graduation_year INTEGER,
  state TEXT,
  high_school TEXT,
  overall_rank INTEGER,
  position_rank INTEGER,
  state_rank INTEGER,
  rating DECIMAL(3,1),
  profile_url TEXT,
  image_url TEXT,
  committed_school_name TEXT,
  committed_school_logo_url TEXT,
  commitment_date DATE,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add manual override tracking to rankings table
ALTER TABLE public.rankings 
  ADD COLUMN IF NOT EXISTS is_manual_override BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS override_reason TEXT,
  ADD COLUMN IF NOT EXISTS overridden_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS overridden_at TIMESTAMPTZ;

-- 3. Add college commitment to athletes table
ALTER TABLE public.athletes 
  ADD COLUMN IF NOT EXISTS committed_school_id UUID REFERENCES public.schools(id),
  ADD COLUMN IF NOT EXISTS commitment_date DATE,
  ADD COLUMN IF NOT EXISTS commitment_status TEXT CHECK (commitment_status IN ('committed', 'decommitted', 'signed'));

-- 4. Add logo fields to schools table
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_cache_updated TIMESTAMPTZ;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_rankings_sport ON public.external_rankings(sport);
CREATE INDEX IF NOT EXISTS idx_external_rankings_rank ON public.external_rankings(overall_rank);
CREATE INDEX IF NOT EXISTS idx_external_rankings_grad_year ON public.external_rankings(graduation_year);
CREATE INDEX IF NOT EXISTS idx_rankings_manual_override ON public.rankings(is_manual_override);
CREATE INDEX IF NOT EXISTS idx_athletes_committed_school ON public.athletes(committed_school_id);
CREATE INDEX IF NOT EXISTS idx_external_rankings_composite ON public.external_rankings(sport, graduation_year, overall_rank);

-- 6. Enable RLS on external_rankings
ALTER TABLE public.external_rankings ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for external_rankings
CREATE POLICY "Admins can manage external rankings"
  ON public.external_rankings
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view external rankings"
  ON public.external_rankings
  FOR SELECT 
  USING (true);

-- 8. Create function to get blended ranking score
CREATE OR REPLACE FUNCTION public.get_blended_ranking_score(
  p_athlete_id UUID,
  p_sport TEXT,
  p_position TEXT,
  p_graduation_year INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_internal_score NUMERIC;
  v_external_avg_rank NUMERIC;
  v_blended_score NUMERIC;
  v_result JSONB;
BEGIN
  -- Get internal composite score from rankings
  SELECT composite_score INTO v_internal_score
  FROM rankings
  WHERE athlete_id = p_athlete_id;
  
  -- Get average external rank (lower is better, so we invert for scoring)
  SELECT AVG(overall_rank) INTO v_external_avg_rank
  FROM external_rankings
  WHERE sport = p_sport
    AND (position IS NULL OR position = p_position)
    AND graduation_year = p_graduation_year;
  
  -- Calculate blended score
  IF v_internal_score IS NOT NULL AND v_external_avg_rank IS NOT NULL THEN
    -- If both exist: 60% external (inverted), 40% internal
    v_blended_score := (((100 - v_external_avg_rank) * 0.6) + (v_internal_score * 0.4));
  ELSIF v_internal_score IS NOT NULL THEN
    -- Only internal score
    v_blended_score := v_internal_score;
  ELSIF v_external_avg_rank IS NOT NULL THEN
    -- Only external rank (inverted for scoring)
    v_blended_score := 100 - v_external_avg_rank;
  ELSE
    v_blended_score := 0;
  END IF;
  
  v_result := jsonb_build_object(
    'internal_score', v_internal_score,
    'external_avg_rank', v_external_avg_rank,
    'blended_score', v_blended_score
  );
  
  RETURN v_result;
END;
$function$;