-- Create college_offers table
CREATE TABLE public.college_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL,
  school_id UUID NOT NULL,
  offer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  offer_type TEXT NOT NULL CHECK (offer_type IN ('full_scholarship', 'partial_scholarship', 'walk_on', 'preferred_walk_on')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  scholarship_amount NUMERIC,
  notes TEXT,
  response_deadline DATE,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.college_offers ENABLE ROW LEVEL SECURITY;

-- Create policies for athletes to manage their own offers
CREATE POLICY "Athletes can view their own offers"
ON public.college_offers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.id = college_offers.athlete_id
    AND athletes.user_id = auth.uid()
  )
);

CREATE POLICY "Athletes can insert their own offers"
ON public.college_offers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.id = college_offers.athlete_id
    AND athletes.user_id = auth.uid()
  )
);

CREATE POLICY "Athletes can update their own offers"
ON public.college_offers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.id = college_offers.athlete_id
    AND athletes.user_id = auth.uid()
  )
);

CREATE POLICY "Athletes can delete their own offers"
ON public.college_offers
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM athletes
    WHERE athletes.id = college_offers.athlete_id
    AND athletes.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_college_offers_updated_at
BEFORE UPDATE ON public.college_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();