-- Create sponsors table
CREATE TABLE public.sponsors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'community',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Anyone can view active sponsors
CREATE POLICY "Anyone can view active sponsors"
ON public.sponsors
FOR SELECT
USING (is_active = true);

-- Admins can manage sponsors
CREATE POLICY "Admins can manage sponsors"
ON public.sponsors
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create index for order
CREATE INDEX idx_sponsors_order ON public.sponsors(order_index);

-- Add trigger for updated_at
CREATE TRIGGER update_sponsors_updated_at
BEFORE UPDATE ON public.sponsors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();