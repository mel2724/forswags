-- Convert roster_needs from JSONB to TEXT and add missing columns
ALTER TABLE schools 
  ALTER COLUMN roster_needs TYPE TEXT USING roster_needs::text,
  ADD COLUMN IF NOT EXISTS school_size TEXT,
  ADD COLUMN IF NOT EXISTS majors TEXT,
  ADD COLUMN IF NOT EXISTS min_gpa DECIMAL(3, 2),
  ADD COLUMN IF NOT EXISTS coach_name TEXT,
  ADD COLUMN IF NOT EXISTS coach_email TEXT,
  ADD COLUMN IF NOT EXISTS social_links TEXT,
  ADD COLUMN IF NOT EXISTS staff_directory_url TEXT,
  ADD COLUMN IF NOT EXISTS email_verified_source_url TEXT;

-- Create unique index for upserts
CREATE UNIQUE INDEX IF NOT EXISTS schools_name_unique_idx ON schools(name);

-- Insert first 5 schools as test
INSERT INTO schools (name, division, conference, location_city, location_state, school_size, majors, min_gpa, roster_needs, coach_name, coach_email, social_links, athletic_website_url, staff_directory_url, email_verified_source_url) VALUES
('Clemson University', 'D1-FBS', 'ACC', 'Clemson', 'SC', 'Large', 'Engineering, Business, Sports Comm', 3.3, 'LB, WR', 'Head Coach', NULL, 'twitter.com/ClemsonFB', 'https://clemsontigers.com', 'https://clemsontigers.com/sports/football/coaches', NULL),
('University of South Carolina', 'D1-FBS', 'SEC', 'Columbia', 'SC', 'Large', 'Business, Health Sciences, Journalism', 3.0, 'QB, OL', 'Head Coach', NULL, 'twitter.com/GamecockFB', 'https://gamecocksonline.com', 'https://gamecocksonline.com/sports/football/roster/coaches', NULL),
('University of North Carolina', 'D1-FBS', 'ACC', 'Chapel Hill', 'NC', 'Large', 'Public Health, Business, Psychology', 3.5, 'WR, CB', 'Head Coach', NULL, 'twitter.com/TarHeelFootball', 'https://goheels.com', 'https://goheels.com/sports/football/coaches', NULL),
('NC State University', 'D1-FBS', 'ACC', 'Raleigh', 'NC', 'Large', 'STEM, Business, Education', 3.0, 'QB, LB', 'Head Coach', NULL, 'twitter.com/PackFootball', 'https://gopack.com', 'https://gopack.com/sports/football/coaches', NULL),
('Duke University', 'D1-FBS', 'ACC', 'Durham', 'NC', 'Medium', 'Engineering, Computer Science, Pre-Med', 3.7, 'OL, DB', 'Head Coach', NULL, 'twitter.com/DukeFOOTBALL', 'https://goduke.com', 'https://goduke.com/sports/football/coaches', NULL)
ON CONFLICT (name) DO UPDATE SET
  division = EXCLUDED.division,
  conference = EXCLUDED.conference,
  location_city = EXCLUDED.location_city,
  location_state = EXCLUDED.location_state,
  school_size = COALESCE(NULLIF(EXCLUDED.school_size, ''), schools.school_size),
  majors = COALESCE(NULLIF(EXCLUDED.majors, ''), schools.majors),
  min_gpa = COALESCE(EXCLUDED.min_gpa, schools.min_gpa),
  roster_needs = COALESCE(NULLIF(EXCLUDED.roster_needs, ''), schools.roster_needs),
  coach_name = COALESCE(NULLIF(EXCLUDED.coach_name, ''), schools.coach_name),
  coach_email = COALESCE(NULLIF(EXCLUDED.coach_email, ''), schools.coach_email),
  social_links = COALESCE(NULLIF(EXCLUDED.social_links, ''), schools.social_links),
  athletic_website_url = COALESCE(NULLIF(EXCLUDED.athletic_website_url, ''), schools.athletic_website_url),
  staff_directory_url = COALESCE(NULLIF(EXCLUDED.staff_directory_url, ''), schools.staff_directory_url),
  email_verified_source_url = COALESCE(NULLIF(EXCLUDED.email_verified_source_url, ''), schools.email_verified_source_url),
  updated_at = NOW();