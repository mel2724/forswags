-- Add external link field to lessons for linking out
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS external_link TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description TEXT;

-- Create video completions tracking table
CREATE TABLE IF NOT EXISTS video_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  watch_duration_seconds INTEGER,
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE video_completions ENABLE ROW LEVEL SECURITY;

-- Users can view their own completions
CREATE POLICY "Users can view their own video completions"
ON video_completions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own completions
CREATE POLICY "Users can track their own video completions"
ON video_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to check video completion badges
CREATE OR REPLACE FUNCTION check_video_completion_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  completion_count INTEGER;
  badge_id UUID;
BEGIN
  -- Count total video completions for user
  SELECT COUNT(*) INTO completion_count
  FROM video_completions
  WHERE user_id = NEW.user_id;

  -- Award "Video Learner" badge at 5 videos
  IF completion_count = 5 THEN
    SELECT id INTO badge_id FROM badges WHERE name = 'Video Learner' LIMIT 1;
    IF badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (NEW.user_id, badge_id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END IF;

  -- Award "Life Skills Student" badge at 10 videos
  IF completion_count = 10 THEN
    SELECT id INTO badge_id FROM badges WHERE name = 'Life Skills Student' LIMIT 1;
    IF badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (NEW.user_id, badge_id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END IF;

  -- Award "Playbook Graduate" badge at 25 videos
  IF completion_count = 25 THEN
    SELECT id INTO badge_id FROM badges WHERE name = 'Playbook Graduate' LIMIT 1;
    IF badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (NEW.user_id, badge_id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for badge awards
DROP TRIGGER IF EXISTS award_video_badges ON video_completions;
CREATE TRIGGER award_video_badges
  AFTER INSERT ON video_completions
  FOR EACH ROW
  EXECUTE FUNCTION check_video_completion_badges();

-- Insert video learning badges if they don't exist
INSERT INTO badges (name, description, icon_url, criteria) VALUES
  ('Video Learner', 'Completed 5 Playbook for Life videos', NULL, 'Watch 5 life skills videos'),
  ('Life Skills Student', 'Completed 10 Playbook for Life videos', NULL, 'Watch 10 life skills videos'),
  ('Playbook Graduate', 'Completed 25 Playbook for Life videos', NULL, 'Watch 25 life skills videos')
ON CONFLICT (name) DO NOTHING;