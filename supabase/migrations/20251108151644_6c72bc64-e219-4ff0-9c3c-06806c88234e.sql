-- Insert tutorial completion badges
INSERT INTO badges (name, description, icon_url, criteria) VALUES
  ('Tutorial Explorer', 'Started your journey by completing your first tutorial section', 'https://api.iconify.design/lucide:rocket.svg?color=%23FF6B35', 'Complete any tutorial section'),
  ('Tutorial Graduate - Athlete', 'Completed the athlete onboarding tutorial', 'https://api.iconify.design/lucide:trophy.svg?color=%23FF6B35', 'Complete all athlete tutorial steps'),
  ('Tutorial Graduate - Parent', 'Completed the parent dashboard tutorial', 'https://api.iconify.design/lucide:users.svg?color=%23FF6B35', 'Complete all parent tutorial steps'),
  ('Tutorial Graduate - Coach', 'Completed the coach dashboard tutorial', 'https://api.iconify.design/lucide:award.svg?color=%23FF6B35', 'Complete all coach tutorial steps'),
  ('Tutorial Graduate - Scout', 'Completed the college scout dashboard tutorial', 'https://api.iconify.design/lucide:search.svg?color=%23FF6B35', 'Complete all recruiter tutorial steps'),
  ('Tutorial Master', 'Completed tutorials for multiple roles', 'https://api.iconify.design/lucide:graduation-cap.svg?color=%23FF6B35', 'Complete tutorials for 2 or more roles')
ON CONFLICT (name) DO NOTHING;

-- Function to award tutorial badges
CREATE OR REPLACE FUNCTION public.award_tutorial_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress JSONB;
  v_completed_count INTEGER := 0;
  v_badge_id UUID;
  v_role_badge_name TEXT;
BEGIN
  v_progress := NEW.tutorial_progress;
  
  IF v_progress IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Count completed tutorial sections
  SELECT COUNT(*) INTO v_completed_count
  FROM jsonb_each(v_progress)
  WHERE value::boolean = true;
  
  -- Award "Tutorial Explorer" badge on first completion
  IF v_completed_count = 1 THEN
    SELECT id INTO v_badge_id FROM badges WHERE name = 'Tutorial Explorer';
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (NEW.id, v_badge_id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END IF;
  
  -- Check for role-specific tutorial completion
  IF (v_progress->>'athlete_tutorial')::boolean = true OR 
     (v_progress->>'step_6')::boolean = true THEN
    SELECT id INTO v_badge_id FROM badges WHERE name = 'Tutorial Graduate - Athlete';
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (NEW.id, v_badge_id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END IF;
  
  IF (v_progress->>'parent_tutorial')::boolean = true THEN
    SELECT id INTO v_badge_id FROM badges WHERE name = 'Tutorial Graduate - Parent';
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (NEW.id, v_badge_id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END IF;
  
  IF (v_progress->>'coach_tutorial')::boolean = true THEN
    SELECT id INTO v_badge_id FROM badges WHERE name = 'Tutorial Graduate - Coach';
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (NEW.id, v_badge_id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END IF;
  
  IF (v_progress->>'recruiter_tutorial')::boolean = true THEN
    SELECT id INTO v_badge_id FROM badges WHERE name = 'Tutorial Graduate - Scout';
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (NEW.id, v_badge_id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END IF;
  
  -- Check for Tutorial Master (completed multiple roles)
  IF v_completed_count >= 2 THEN
    SELECT id INTO v_badge_id FROM badges WHERE name = 'Tutorial Master';
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (NEW.id, v_badge_id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to award badges when tutorial_progress is updated
DROP TRIGGER IF EXISTS trigger_award_tutorial_badge ON profiles;
CREATE TRIGGER trigger_award_tutorial_badge
AFTER UPDATE OF tutorial_progress ON profiles
FOR EACH ROW
WHEN (OLD.tutorial_progress IS DISTINCT FROM NEW.tutorial_progress)
EXECUTE FUNCTION award_tutorial_badge();