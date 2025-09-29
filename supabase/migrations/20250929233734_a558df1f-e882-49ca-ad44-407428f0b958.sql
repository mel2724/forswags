-- Create storage bucket for SCORM packages (skip if exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'scorm-packages') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'scorm-packages',
      'scorm-packages',
      true,
      524288000,
      ARRAY['application/zip', 'application/x-zip-compressed', 'application/x-compressed', 'multipart/x-zip']
    );
  END IF;
END $$;

-- Storage policies for SCORM packages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Admins can upload SCORM packages'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Anyone can view SCORM packages'
  ) THEN
    CREATE POLICY "Anyone can view SCORM packages"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'scorm-packages');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Admins can update SCORM packages'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Admins can delete SCORM packages'
  ) THEN
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
  END IF;
END $$;

-- Create table for SCORM tracking if it doesn't exist
CREATE TABLE IF NOT EXISTS scorm_progress (
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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'scorm_progress' 
    AND policyname = 'Users can view their own SCORM progress'
  ) THEN
    CREATE POLICY "Users can view their own SCORM progress"
    ON scorm_progress
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'scorm_progress' 
    AND policyname = 'Users can insert their own SCORM progress'
  ) THEN
    CREATE POLICY "Users can insert their own SCORM progress"
    ON scorm_progress
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'scorm_progress' 
    AND policyname = 'Users can update their own SCORM progress'
  ) THEN
    CREATE POLICY "Users can update their own SCORM progress"
    ON scorm_progress
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_scorm_progress_updated_at'
  ) THEN
    CREATE TRIGGER update_scorm_progress_updated_at
    BEFORE UPDATE ON scorm_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;