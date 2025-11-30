-- Add video_url and scoring fields to evaluations table
ALTER TABLE public.evaluations
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS scores JSONB DEFAULT '{}';

-- Add claimed_at timestamp
ALTER TABLE public.evaluations
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Update RLS to allow coaches to view unclaimed evaluations
CREATE POLICY "Coaches can view available evaluations"
ON public.evaluations
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'coach') AND 
  (coach_id IS NULL OR coach_id = auth.uid())
);

-- Allow coaches to claim evaluations
CREATE POLICY "Coaches can claim evaluations"
ON public.evaluations
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'coach') AND coach_id IS NULL)
WITH CHECK (coach_id = auth.uid());

-- Create evaluation_criteria table for scoring
CREATE TABLE IF NOT EXISTS public.evaluation_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  max_score INTEGER NOT NULL DEFAULT 10,
  category TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;

-- Anyone can view criteria
CREATE POLICY "Anyone can view evaluation criteria"
ON public.evaluation_criteria
FOR SELECT
TO authenticated
USING (true);

-- Insert default evaluation criteria
INSERT INTO public.evaluation_criteria (name, description, max_score, category, order_index) VALUES
('Technical Skills', 'Fundamental technique and execution', 10, 'Skills', 1),
('Game IQ', 'Decision making and field awareness', 10, 'Mental', 2),
('Athleticism', 'Speed, agility, and physical ability', 10, 'Physical', 3),
('Consistency', 'Reliability and performance consistency', 10, 'Performance', 4),
('Coachability', 'Ability to learn and adapt', 10, 'Intangibles', 5)
ON CONFLICT DO NOTHING;