-- Create waitlist table for parents and recruiters
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL, -- 'parent' or 'recruiter'
  organization TEXT,
  sport TEXT,
  level TEXT,
  location TEXT,
  how_heard TEXT,
  additional_notes TEXT,
  subscribe_updates BOOLEAN DEFAULT true,
  interested_in_beta BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (it's a public signup form)
CREATE POLICY "Anyone can sign up for waitlist"
  ON public.waitlist_signups
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only admins can view waitlist
CREATE POLICY "Admins can view waitlist"
  ON public.waitlist_signups
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_waitlist_signups_updated_at
  BEFORE UPDATE ON public.waitlist_signups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();