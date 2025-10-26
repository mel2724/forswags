-- Add 'prime_dime' to the allowed template types
ALTER TABLE post_templates 
DROP CONSTRAINT IF EXISTS post_templates_template_type_check;

ALTER TABLE post_templates 
ADD CONSTRAINT post_templates_template_type_check 
CHECK (template_type IN ('offer', 'commitment', 'achievement', 'training', 'gameday', 'scouting', 'custom', 'recruitment', 'prime_dime'));

-- Insert Prime Dime social media template
INSERT INTO post_templates (
  name,
  description,
  template_type,
  content_template,
  suggested_hashtags,
  is_public,
  usage_count
) VALUES (
  'Prime Dime College Matches',
  'Share your top Prime Dime college matches with the community',
  'prime_dime',
  '🎯 Excited to share my Prime Dime college matches! 🏆

After working with ForSWAGs'' expert team, I''ve identified my top college fits:

1. {College Name 1} - {Match Score}% match
2. {College Name 2} - {Match Score}% match
3. {College Name 3} - {Match Score}% match

These schools align perfectly with my athletic, academic, and personal goals. Ready to take the next step in my recruiting journey! 💪',
  ARRAY['#CollegeRecruiting', '#StudentAthlete', '#ForSWAGs', '#PrimeDime', '#RecruitingJourney'],
  true,
  0
);