-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create role enum
CREATE TYPE app_role AS ENUM ('athlete', 'parent', 'coach', 'recruiter', 'admin');

-- Create subscription plan enum
CREATE TYPE subscription_plan AS ENUM ('free', 'annual', 'monthly');

-- Create evaluation status enum
CREATE TYPE evaluation_status AS ENUM ('pending', 'in_progress', 'completed');

-- Create payment status enum
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- User profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User roles table (separate from profiles for security)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Memberships table
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL, -- 'stripe' or 'paypal'
  transaction_id TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Athletes table (athlete profile data)
CREATE TABLE athletes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  parent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sport TEXT NOT NULL,
  position TEXT,
  graduation_year INTEGER,
  high_school TEXT,
  height_inches INTEGER,
  weight_lbs INTEGER,
  gpa DECIMAL(3, 2),
  sat_score INTEGER,
  act_score INTEGER,
  bio TEXT,
  highlights_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Athlete stats table
CREATE TABLE athlete_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  season TEXT NOT NULL,
  stat_name TEXT NOT NULL,
  stat_value DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rankings table
CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  overall_rank INTEGER,
  position_rank INTEGER,
  state_rank INTEGER,
  national_rank INTEGER,
  composite_score DECIMAL(5, 2),
  last_calculated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evaluations table
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status evaluation_status NOT NULL DEFAULT 'pending',
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  rating DECIMAL(3, 2),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schools table
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  division TEXT,
  conference TEXT,
  location_city TEXT,
  location_state TEXT,
  enrollment INTEGER,
  acceptance_rate DECIMAL(5, 2),
  avg_sat INTEGER,
  avg_act INTEGER,
  tuition DECIMAL(10, 2),
  website_url TEXT,
  athletic_website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- College match preferences
CREATE TABLE college_match_prefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE UNIQUE,
  preferred_divisions TEXT[],
  preferred_states TEXT[],
  max_distance_miles INTEGER,
  min_enrollment INTEGER,
  max_enrollment INTEGER,
  max_tuition DECIMAL(10, 2),
  academic_priorities TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- College matches table
CREATE TABLE college_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  match_score DECIMAL(5, 2),
  academic_fit DECIMAL(5, 2),
  athletic_fit DECIMAL(5, 2),
  financial_fit DECIMAL(5, 2),
  is_saved BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(athlete_id, school_id)
);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  duration_minutes INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Modules table
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lessons table
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE UNIQUE,
  title TEXT NOT NULL,
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quiz attempts table
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  answers JSONB NOT NULL,
  passed BOOLEAN NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Badges table
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  criteria TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User badges table
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Media assets table
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT NOT NULL, -- 'image', 'video', 'document'
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Social posts table
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  watermark_applied BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_match_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies (admin only can manage roles)
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Memberships policies
CREATE POLICY "Users can view their own membership" ON memberships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all memberships" ON memberships
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON payments
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Athletes policies (public directory, but edit own)
CREATE POLICY "Anyone can view published athlete profiles" ON athletes
  FOR SELECT USING (true);

CREATE POLICY "Athletes can update their own profile" ON athletes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Athletes can insert their own profile" ON athletes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Parents can view their children's profiles" ON athletes
  FOR SELECT USING (auth.uid() = parent_id);

-- Athlete stats policies
CREATE POLICY "Anyone can view athlete stats" ON athlete_stats
  FOR SELECT USING (true);

CREATE POLICY "Athletes can manage their own stats" ON athlete_stats
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM athletes
      WHERE athletes.id = athlete_stats.athlete_id
      AND athletes.user_id = auth.uid()
    )
  );

-- Rankings policies
CREATE POLICY "Anyone can view rankings" ON rankings
  FOR SELECT USING (true);

-- Evaluations policies
CREATE POLICY "Athletes can view their own evaluations" ON evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM athletes
      WHERE athletes.id = evaluations.athlete_id
      AND athletes.user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can view assigned evaluations" ON evaluations
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can update assigned evaluations" ON evaluations
  FOR UPDATE USING (auth.uid() = coach_id);

-- Schools policies (public data)
CREATE POLICY "Anyone can view schools" ON schools
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage schools" ON schools
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- College match prefs policies
CREATE POLICY "Athletes can manage their own prefs" ON college_match_prefs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM athletes
      WHERE athletes.id = college_match_prefs.athlete_id
      AND athletes.user_id = auth.uid()
    )
  );

-- College matches policies
CREATE POLICY "Athletes can view their own matches" ON college_matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM athletes
      WHERE athletes.id = college_matches.athlete_id
      AND athletes.user_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can view all matches" ON college_matches
  FOR SELECT USING (has_role(auth.uid(), 'recruiter'));

-- Courses policies (public content)
CREATE POLICY "Anyone can view published courses" ON courses
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage courses" ON courses
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Modules policies
CREATE POLICY "Anyone can view modules of published courses" ON modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id
      AND courses.is_published = true
    )
  );

-- Lessons policies
CREATE POLICY "Anyone can view lessons of published courses" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id
      AND courses.is_published = true
    )
  );

-- Quiz policies
CREATE POLICY "Anyone can view quizzes" ON quizzes
  FOR SELECT USING (true);

-- Questions policies
CREATE POLICY "Anyone can view questions" ON questions
  FOR SELECT USING (true);

-- Quiz attempts policies
CREATE POLICY "Users can view their own attempts" ON quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Badges policies (public)
CREATE POLICY "Anyone can view badges" ON badges
  FOR SELECT USING (true);

-- User badges policies
CREATE POLICY "Users can view their own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view all user badges" ON user_badges
  FOR SELECT USING (true);

-- Media assets policies
CREATE POLICY "Users can view their own media" ON media_assets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Athletes can view media linked to them" ON media_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM athletes
      WHERE athletes.id = media_assets.athlete_id
      AND athletes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own media" ON media_assets
  FOR ALL USING (auth.uid() = user_id);

-- Social posts policies
CREATE POLICY "Users can view published posts" ON social_posts
  FOR SELECT USING (is_draft = false OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own posts" ON social_posts
  FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE ON athletes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_athlete_stats_updated_at BEFORE UPDATE ON athlete_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rankings_updated_at BEFORE UPDATE ON rankings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_college_match_prefs_updated_at BEFORE UPDATE ON college_match_prefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_college_matches_updated_at BEFORE UPDATE ON college_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_assets_updated_at BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();