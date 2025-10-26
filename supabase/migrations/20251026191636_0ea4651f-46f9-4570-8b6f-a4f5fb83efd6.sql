-- Add platform field to post_templates table
ALTER TABLE post_templates 
ADD COLUMN IF NOT EXISTS platform text;

-- Add check constraint for valid platforms
ALTER TABLE post_templates
DROP CONSTRAINT IF EXISTS post_templates_platform_check;

ALTER TABLE post_templates
ADD CONSTRAINT post_templates_platform_check 
CHECK (platform IS NULL OR platform IN ('twitter', 'instagram', 'facebook', 'tiktok', 'linkedin'));

-- Delete existing generic Prime Dime template
DELETE FROM post_templates 
WHERE template_type = 'prime_dime';

-- Insert platform-specific Prime Dime templates

-- Twitter/X version (280 char limit)
INSERT INTO post_templates (name, description, template_type, platform, content_template, suggested_hashtags, is_public)
VALUES (
  'Prime Dime - Twitter/X',
  'Concise format optimized for Twitter/X (280 characters)',
  'prime_dime',
  'twitter',
  '🎯 Top college matches:
1. {College Name}
2. {College Name}
Ready for the next level! #D1Bound',
  ARRAY['D1Bound', 'RecruitMe', 'NextLevel', 'CollegeRecruiting'],
  true
);

-- Instagram version
INSERT INTO post_templates (name, description, template_type, platform, content_template, suggested_hashtags, is_public)
VALUES (
  'Prime Dime - Instagram',
  'Visual-first format optimized for Instagram with emojis and engagement',
  'prime_dime',
  'instagram',
  '🎯✨ MY TOP 3 PRIME DIME COLLEGE MATCHES! ✨🎯

After working with @ForSWAGs expert team, I found my perfect fits:

🏆 {College Name}
🏆 {College Name}  
🏆 {College Name}

These schools align perfectly with my athletic, academic, and personal goals! 💪

Ready to take the next step in my recruiting journey! 🔥

👇 Comment your favorite school below!

#PrimeDime #CollegeRecruiting',
  ARRAY['PrimeDime', 'CollegeRecruiting', 'D1Bound', 'RecruitMe', 'StudentAthlete', 'NextLevel', 'CollegeBound', 'RecruitingJourney', 'ForSWAGs'],
  true
);

-- Facebook version
INSERT INTO post_templates (name, description, template_type, platform, content_template, suggested_hashtags, is_public)
VALUES (
  'Prime Dime - Facebook',
  'Narrative format optimized for Facebook with storytelling',
  'prime_dime',
  'facebook',
  '🎯 Excited to Share My College Journey Update!

After months of hard work both on the field and in the classroom, I''m thrilled to announce that I''ve completed my Prime Dime college analysis with ForSWAGs!

Through their comprehensive evaluation process, we''ve identified my top 3 college matches:

✅ {College Name}
✅ {College Name}
✅ {College Name}

Each of these schools offers exactly what I''m looking for - the right balance of athletic competition, academic programs, campus culture, and personal fit.

I''m incredibly grateful to my family, coaches, and the ForSWAGs team for their support throughout this process. The next chapter is going to be amazing!

Stay tuned for more updates on my recruiting journey! 🏆💪',
  ARRAY['CollegeRecruiting', 'StudentAthlete', 'PrimeDime', 'RecruitingJourney'],
  true
);

-- TikTok version
INSERT INTO post_templates (name, description, template_type, platform, content_template, suggested_hashtags, is_public)
VALUES (
  'Prime Dime - TikTok',
  'Casual, authentic format optimized for TikTok with trending language',
  'prime_dime',
  'tiktok',
  'POV: You just found your dream colleges 🎯✨

My top 3 Prime Dime matches:
1. {College Name} 🏆
2. {College Name} 🏆
3. {College Name} 🏆

Not me actually finding the perfect fit schools 😭💪

Big thanks to @ForSWAGs for the analysis! The recruiting journey is getting real! 🔥

Who else is on their college search journey? Drop your sport below! 👇',
  ARRAY['CollegeRecruiting', 'StudentAthlete', 'PrimeDime', 'D1Bound', 'CollegeBound', 'RecruitMe', 'AthleteLife', 'ForYouPage'],
  true
);

-- LinkedIn version
INSERT INTO post_templates (name, description, template_type, platform, content_template, suggested_hashtags, is_public)
VALUES (
  'Prime Dime - LinkedIn',
  'Professional format optimized for LinkedIn with career focus',
  'prime_dime',
  'linkedin',
  '🎓 College Search Milestone: Prime Dime Analysis Complete

I am pleased to announce the completion of my comprehensive college matching analysis through ForSWAGs'' Prime Dime program. After careful evaluation of athletic opportunities, academic offerings, and institutional fit, I have identified my top three target schools:

• {College Name}
• {College Name}
• {College Name}

This data-driven approach has provided valuable insights into programs that align with both my immediate athletic goals and long-term career aspirations. Each institution offers strong programs in my intended field of study, competitive athletic opportunities at my skill level, and campus environments that match my personal values.

I look forward to continuing this journey and am grateful for the guidance of my coaches, family, and the ForSWAGs team throughout this process.

#StudentAthlete #CollegeRecruiting #CareerDevelopment #AthleticRecruiting',
  ARRAY['StudentAthlete', 'CollegeRecruiting', 'CareerDevelopment', 'AthleticRecruiting', 'PrimeDime'],
  true
);