-- Create table to track module completion certificates
CREATE TABLE IF NOT EXISTS module_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  certificate_url text,
  emailed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Enable RLS
ALTER TABLE module_certificates ENABLE ROW LEVEL SECURITY;

-- Users can view their own certificates
CREATE POLICY "Users can view their own certificates"
ON module_certificates FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- System can insert certificates
CREATE POLICY "System can insert certificates"
ON module_certificates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all certificates
CREATE POLICY "Admins can view all certificates"
ON module_certificates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create index for performance
CREATE INDEX idx_module_certificates_user_module ON module_certificates(user_id, module_id);
CREATE INDEX idx_module_certificates_issued_at ON module_certificates(issued_at DESC);