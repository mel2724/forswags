-- Add SCORM support to lessons table
ALTER TABLE lessons
ADD COLUMN scorm_package_url TEXT,
ADD COLUMN scorm_version TEXT CHECK (scorm_version IN ('1.2', '2004')),
ADD COLUMN is_scorm_content BOOLEAN DEFAULT false;

-- Create storage bucket for SCORM packages
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'scorm-packages',
  'scorm-packages',
  true,
  524288000, -- 500MB limit for SCORM packages
  ARRAY['application/zip', 'application/x-zip-compressed', 'application/x-compressed', 'multipart/x-zip']
);

-- Storage policies for SCORM packages
CREATE POLICY "Admins can upload SCORM packages"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'scorm-packages' AND
  (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
);

CREATE POLICY "Anyone can view SCORM packages"
ON storage.objects
FOR SELECT
USING (bucket_id = 'scorm-packages');

CREATE POLICY "Admins can update SCORM packages"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'scorm-packages' AND
  (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
);

CREATE POLICY "Admins can delete SCORM packages"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'scorm-packages' AND
  (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
);

-- Create table for SCORM tracking
CREATE TABLE scorm_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  lesson_status TEXT DEFAULT 'not attempted',
  lesson_location TEXT,
  suspend_data TEXT,
  score_raw NUMERIC,
  score_min NUMERIC,
  score_max NUMERIC,
  session_time TEXT,
  total_time TEXT,
  completion_status TEXT,
  success_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS on scorm_progress
ALTER TABLE scorm_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for scorm_progress
CREATE POLICY "Users can view their own SCORM progress"
ON scorm_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own SCORM progress"
ON scorm_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SCORM progress"
ON scorm_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_scorm_progress_updated_at
BEFORE UPDATE ON scorm_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();