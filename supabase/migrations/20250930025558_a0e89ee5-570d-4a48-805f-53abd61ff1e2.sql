-- Add comprehensive athlete profile fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'United States';

-- Add extensive athlete-specific fields to athletes table
ALTER TABLE public.athletes
ADD COLUMN IF NOT EXISTS secondary_sports text[],
ADD COLUMN IF NOT EXISTS club_team_name text,
ADD COLUMN IF NOT EXISTS ncaa_eligibility_number text,
ADD COLUMN IF NOT EXISTS jersey_number text,
ADD COLUMN IF NOT EXISTS filled_out_by text CHECK (filled_out_by IN ('athlete', 'parent', 'coach')),
ADD COLUMN IF NOT EXISTS nickname text,
ADD COLUMN IF NOT EXISTS academic_achievements text,
ADD COLUMN IF NOT EXISTS favorite_subject text,
ADD COLUMN IF NOT EXISTS has_honors_ap_ib boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS honors_courses text,
ADD COLUMN IF NOT EXISTS legal_situations boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS legal_situations_explanation text,
ADD COLUMN IF NOT EXISTS forty_yard_dash numeric(4,2),
ADD COLUMN IF NOT EXISTS vertical_jump numeric(5,2),
ADD COLUMN IF NOT EXISTS bench_press_max integer,
ADD COLUMN IF NOT EXISTS squat_max integer,
ADD COLUMN IF NOT EXISTS key_stats jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS athletic_awards text[],
ADD COLUMN IF NOT EXISTS leadership_roles text,
ADD COLUMN IF NOT EXISTS notable_performances text,
ADD COLUMN IF NOT EXISTS being_recruited boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recruiting_schools text[],
ADD COLUMN IF NOT EXISTS received_offers boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS offer_schools text[],
ADD COLUMN IF NOT EXISTS committed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS committed_school text,
ADD COLUMN IF NOT EXISTS camps_attended text[],
ADD COLUMN IF NOT EXISTS upcoming_camps text[],
ADD COLUMN IF NOT EXISTS twitter_handle text,
ADD COLUMN IF NOT EXISTS instagram_handle text,
ADD COLUMN IF NOT EXISTS tiktok_handle text,
ADD COLUMN IF NOT EXISTS personal_description text,
ADD COLUMN IF NOT EXISTS five_year_goals text,
ADD COLUMN IF NOT EXISTS motivation text,
ADD COLUMN IF NOT EXISTS challenges_overcome text,
ADD COLUMN IF NOT EXISTS role_model text,
ADD COLUMN IF NOT EXISTS community_involvement text,
ADD COLUMN IF NOT EXISTS message_to_coaches text;

-- Create coach_contacts table
CREATE TABLE IF NOT EXISTS public.coach_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  coach_type text NOT NULL CHECK (coach_type IN ('head_coach', 'position_coach', 'club_coach')),
  coach_name text NOT NULL,
  coach_email text,
  coach_phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create parent_guardians table
CREATE TABLE IF NOT EXISTS public.parent_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  parent_name text NOT NULL,
  parent_email text,
  parent_phone text,
  relationship text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.coach_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_guardians ENABLE ROW LEVEL SECURITY;

-- RLS policies for coach_contacts
CREATE POLICY "Athletes can view their own coach contacts"
  ON public.coach_contacts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.athletes
    WHERE athletes.id = coach_contacts.athlete_id
    AND athletes.user_id = auth.uid()
  ));

CREATE POLICY "Athletes can manage their own coach contacts"
  ON public.coach_contacts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.athletes
    WHERE athletes.id = coach_contacts.athlete_id
    AND athletes.user_id = auth.uid()
  ));

-- RLS policies for parent_guardians
CREATE POLICY "Athletes can view their own parent info"
  ON public.parent_guardians FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.athletes
    WHERE athletes.id = parent_guardians.athlete_id
    AND athletes.user_id = auth.uid()
  ));

CREATE POLICY "Athletes can manage their own parent info"
  ON public.parent_guardians FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.athletes
    WHERE athletes.id = parent_guardians.athlete_id
    AND athletes.user_id = auth.uid()
  ));

-- Create triggers for updated_at
CREATE TRIGGER update_coach_contacts_updated_at
  BEFORE UPDATE ON public.coach_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parent_guardians_updated_at
  BEFORE UPDATE ON public.parent_guardians
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();