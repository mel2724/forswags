-- Performance optimizations: Add indexes for frequently queried columns

-- Athletes table indexes
CREATE INDEX IF NOT EXISTS idx_athletes_user_id ON athletes(user_id);
CREATE INDEX IF NOT EXISTS idx_athletes_sport_graduation ON athletes(sport, graduation_year) WHERE visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_athletes_username ON athletes(username) WHERE username IS NOT NULL;

-- Media assets indexes
CREATE INDEX IF NOT EXISTS idx_media_assets_athlete_id ON media_assets(athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id, media_type);

-- Evaluations indexes  
CREATE INDEX IF NOT EXISTS idx_evaluations_athlete_id ON evaluations(athlete_id, purchased_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_coach_id ON evaluations(coach_id, status) WHERE coach_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status, purchased_at DESC) WHERE status IN ('pending', 'in_progress');

-- College matches indexes
CREATE INDEX IF NOT EXISTS idx_college_matches_athlete_id ON college_matches(athlete_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_college_matches_saved ON college_matches(athlete_id, is_saved) WHERE is_saved = true;

-- Profile views indexes (if table exists)
CREATE INDEX IF NOT EXISTS idx_profile_views_athlete_viewed ON profile_views(athlete_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id, viewed_at DESC);

-- Course progress indexes
CREATE INDEX IF NOT EXISTS idx_course_progress_user_course ON course_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_completed ON course_progress(user_id) WHERE completed_at IS NOT NULL;

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Alumni connections indexes
CREATE INDEX IF NOT EXISTS idx_alumni_connections_athlete ON alumni_connections(athlete_id, status);
CREATE INDEX IF NOT EXISTS idx_alumni_connections_alumni ON alumni_connections(alumni_id, status);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_athletes_search ON athletes(sport, position, graduation_year) WHERE visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_evaluations_available ON evaluations(status, purchased_at) WHERE coach_id IS NULL AND status = 'pending';
