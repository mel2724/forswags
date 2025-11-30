-- Create course progress tracking table
CREATE TABLE IF NOT EXISTS course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed_lessons JSONB DEFAULT '[]'::jsonb,
  progress_percentage INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create course certificates table
CREATE TABLE IF NOT EXISTS course_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_url TEXT,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create course bookmarks/notes table
CREATE TABLE IF NOT EXISTS course_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  timestamp_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create lesson quizzes table
CREATE TABLE IF NOT EXISTS lesson_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update questions table to link to quizzes
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS quiz_id UUID REFERENCES lesson_quizzes(id) ON DELETE CASCADE;

-- Create quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES lesson_quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  answers JSONB NOT NULL,
  passed BOOLEAN NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own progress" ON course_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON course_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON course_progress;
DROP POLICY IF EXISTS "Users can view their own certificates" ON course_certificates;
DROP POLICY IF EXISTS "System can insert certificates" ON course_certificates;
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON course_bookmarks;
DROP POLICY IF EXISTS "Anyone can view quizzes" ON lesson_quizzes;
DROP POLICY IF EXISTS "Admins can manage quizzes" ON lesson_quizzes;
DROP POLICY IF EXISTS "Users can view their own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can create their own attempts" ON quiz_attempts;

-- RLS Policies for course_progress
CREATE POLICY "Users can view their own progress"
  ON course_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON course_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON course_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for course_certificates
CREATE POLICY "Users can view their own certificates"
  ON course_certificates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert certificates"
  ON course_certificates FOR INSERT
  WITH CHECK (true);

-- RLS Policies for course_bookmarks
CREATE POLICY "Users can manage their own bookmarks"
  ON course_bookmarks FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for lesson_quizzes
CREATE POLICY "Anyone can view quizzes"
  ON lesson_quizzes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage quizzes"
  ON lesson_quizzes FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for quiz_attempts
CREATE POLICY "Users can view their own attempts"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_progress_user_course ON course_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_course_certificates_user ON course_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_course_bookmarks_user_lesson ON course_bookmarks(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);

-- Create trigger for updating course progress
CREATE OR REPLACE FUNCTION update_course_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS course_progress_updated_at ON course_progress;
CREATE TRIGGER course_progress_updated_at
  BEFORE UPDATE ON course_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_course_progress_timestamp();

DROP TRIGGER IF EXISTS course_bookmarks_updated_at ON course_bookmarks;
CREATE TRIGGER course_bookmarks_updated_at
  BEFORE UPDATE ON course_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_course_progress_timestamp();