-- Add foreign key relationship between college_offers and schools
ALTER TABLE public.college_offers
ADD CONSTRAINT college_offers_school_id_fkey
FOREIGN KEY (school_id)
REFERENCES public.schools(id)
ON DELETE CASCADE;