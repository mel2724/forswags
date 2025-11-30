-- Create alumni network tables
CREATE TABLE IF NOT EXISTS public.alumni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  school_id uuid NOT NULL,
  graduation_year integer NOT NULL,
  sport text NOT NULL,
  position text,
  professional_role text,
  company text,
  linkedin_url text,
  bio text,
  willing_to_mentor boolean DEFAULT true,
  available_for_calls boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.alumni ENABLE ROW LEVEL SECURITY;

-- Alumni policies
CREATE POLICY "Alumni can view their own profile"
  ON public.alumni FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Alumni can update their own profile"
  ON public.alumni FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Alumni can insert their own profile"
  ON public.alumni FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view alumni profiles"
  ON public.alumni FOR SELECT
  USING (true);

-- Create alumni connections table
CREATE TABLE IF NOT EXISTS public.alumni_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL,
  alumni_id uuid REFERENCES public.alumni(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.alumni_connections ENABLE ROW LEVEL SECURITY;

-- Alumni connections policies
CREATE POLICY "Athletes can create connection requests"
  ON public.alumni_connections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = athlete_id 
      AND athletes.user_id = auth.uid()
    )
  );

CREATE POLICY "Athletes can view their own connections"
  ON public.alumni_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = athlete_id 
      AND athletes.user_id = auth.uid()
    )
  );

CREATE POLICY "Alumni can view connections to them"
  ON public.alumni_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM alumni 
      WHERE alumni.id = alumni_id 
      AND alumni.user_id = auth.uid()
    )
  );

CREATE POLICY "Alumni can update connection status"
  ON public.alumni_connections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM alumni 
      WHERE alumni.id = alumni_id 
      AND alumni.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_alumni_school ON public.alumni(school_id);
CREATE INDEX idx_alumni_sport ON public.alumni(sport);
CREATE INDEX idx_alumni_connections_athlete ON public.alumni_connections(athlete_id);
CREATE INDEX idx_alumni_connections_alumni ON public.alumni_connections(alumni_id);

-- Create updated_at trigger for alumni
CREATE TRIGGER update_alumni_updated_at
  BEFORE UPDATE ON public.alumni
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for alumni_connections
CREATE TRIGGER update_alumni_connections_updated_at
  BEFORE UPDATE ON public.alumni_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();