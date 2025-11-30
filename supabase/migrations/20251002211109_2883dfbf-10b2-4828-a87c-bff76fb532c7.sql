-- Update tier features for free membership restrictions
-- Free tier gets basic profile + full Playbook access only
-- No press releases, AI captions, or premium features

-- Add new feature keys for social media tools
INSERT INTO tier_features (tier, feature_key, is_enabled, limit_value) VALUES
  -- Free tier: NO access to AI tools
  ('free', 'press_release_generator', false, NULL),
  ('free', 'ai_caption_generator', false, NULL),
  ('free', 'playbook_courses', true, NULL), -- Full course access
  ('free', 'social_media_graphics', false, NULL),
  
  -- Pro Monthly tier: Full access
  ('pro_monthly', 'press_release_generator', true, NULL),
  ('pro_monthly', 'ai_caption_generator', true, NULL),
  ('pro_monthly', 'playbook_courses', true, NULL),
  ('pro_monthly', 'social_media_graphics', true, NULL),
  
  -- Championship Yearly tier: Full access
  ('championship_yearly', 'press_release_generator', true, NULL),
  ('championship_yearly', 'ai_caption_generator', true, NULL),
  ('championship_yearly', 'playbook_courses', true, NULL),
  ('championship_yearly', 'social_media_graphics', true, NULL)
ON CONFLICT (tier, feature_key) 
DO UPDATE SET 
  is_enabled = EXCLUDED.is_enabled,
  limit_value = EXCLUDED.limit_value;

-- Update existing free tier features to be more restrictive
UPDATE tier_features 
SET is_enabled = false 
WHERE tier = 'free' 
  AND feature_key IN (
    'public_profile',
    'college_matching', 
    'analytics',
    'profile_view_notifications',
    'rankings',
    'media_unlimited',
    'evaluation_discount'
  );

-- Ensure courses are enabled for ALL tiers
UPDATE tier_features 
SET is_enabled = true 
WHERE feature_key = 'playbook_courses';

-- Add comment for clarity
COMMENT ON TABLE tier_features IS 'Defines feature access per membership tier. Free tier gets basic profile + full Playbook for Life access only.';