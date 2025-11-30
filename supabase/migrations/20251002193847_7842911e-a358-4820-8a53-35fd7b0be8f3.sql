-- Add negotiation notes and document storage to college_offers
ALTER TABLE college_offers 
ADD COLUMN IF NOT EXISTS negotiation_notes TEXT,
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

-- Add signing day date to athletes table
ALTER TABLE athletes
ADD COLUMN IF NOT EXISTS signing_day_date DATE;

-- Create storage bucket for offer documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-documents', 'offer-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for offer documents
CREATE POLICY "Athletes can upload their offer documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'offer-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Athletes can view their offer documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'offer-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Athletes can delete their offer documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'offer-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);