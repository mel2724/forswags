-- Create coach applications table
CREATE TABLE public.coach_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  experience_years INTEGER,
  certifications TEXT,
  coaching_background TEXT NOT NULL,
  why_mentor TEXT NOT NULL,
  specializations TEXT[] DEFAULT '{}',
  resume_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT
);

-- Enable RLS
ALTER TABLE public.coach_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit applications
CREATE POLICY "Anyone can submit coach applications"
ON public.coach_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow applicants to view their own applications
CREATE POLICY "Users can view their own applications"
ON public.coach_applications
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = email);

-- Admins can manage all applications
CREATE POLICY "Admins can manage applications"
ON public.coach_applications
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_coach_applications_updated_at
BEFORE UPDATE ON public.coach_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create coach profiles table for approved coaches
CREATE TABLE public.coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  bio TEXT,
  specializations TEXT[] DEFAULT '{}',
  certifications TEXT,
  experience_years INTEGER,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

-- Coaches can view and update their own profile
CREATE POLICY "Coaches can manage their own profile"
ON public.coach_profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Anyone can view active coach profiles
CREATE POLICY "Anyone can view active coaches"
ON public.coach_profiles
FOR SELECT
TO authenticated
USING (is_active = true);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage coach profiles"
ON public.coach_profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_coach_profiles_updated_at
BEFORE UPDATE ON public.coach_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();