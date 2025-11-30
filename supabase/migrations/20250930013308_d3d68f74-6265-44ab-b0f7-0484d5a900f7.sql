-- Add recruiter role to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'recruiter';

-- Update profiles table to include first_name and last_name
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Update athletes table to match seed data schema
ALTER TABLE public.athletes
ADD COLUMN IF NOT EXISTS graduation_year integer,
ADD COLUMN IF NOT EXISTS dominant_hand text,
ADD COLUMN IF NOT EXISTS profile_photo_url text,
ADD COLUMN IF NOT EXISTS profile_completion_pct integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public';

-- Rename columns in athletes to match seed data
ALTER TABLE public.athletes
RENAME COLUMN height_inches TO height_in;

ALTER TABLE public.athletes
RENAME COLUMN weight_lbs TO weight_lb;

-- Update athlete_stats to support flexible metrics
ALTER TABLE public.athlete_stats
ADD COLUMN IF NOT EXISTS metrics jsonb,
ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS source text;

-- Update schools table with additional data
ALTER TABLE public.schools
ADD COLUMN IF NOT EXISTS avg_gpa numeric,
ADD COLUMN IF NOT EXISTS roster_needs jsonb,
ADD COLUMN IF NOT EXISTS tuition_estimate numeric,
ADD COLUMN IF NOT EXISTS contact_email text;

-- Create recruiter_profiles table
CREATE TABLE IF NOT EXISTS public.recruiter_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  school_name text NOT NULL,
  division text,
  title text,
  primary_positions text[],
  states_focus text[],
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE public.recruiter_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view all profiles"
ON public.recruiter_profiles FOR SELECT
USING (true);

CREATE POLICY "Recruiters can manage their own profile"
ON public.recruiter_profiles FOR ALL
USING (auth.uid() = user_id);

-- Create saved_searches table
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL,
  sort jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved searches"
ON public.saved_searches FOR ALL
USING (auth.uid() = user_id);

-- Create notification_prefs table
CREATE TABLE IF NOT EXISTS public.notification_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  template_key text NOT NULL,
  payload jsonb,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences"
ON public.notification_prefs FOR ALL
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_recruiter_profiles_updated_at
BEFORE UPDATE ON public.recruiter_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_searches_updated_at
BEFORE UPDATE ON public.saved_searches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_prefs_updated_at
BEFORE UPDATE ON public.notification_prefs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();