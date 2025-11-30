# Athlete Promotion Manager Guide

## Overview
The Athlete Promotion Manager is a comprehensive feature that automates athlete spotlights and social media content generation to ensure every athlete gets equal visibility and promotion.

## Features

### 1. Athlete of the Week
- **Automated Selection**: Every Sunday morning, the system automatically selects an athlete based on rotating criteria
- **Manual Generation**: Admins can generate the selection early if needed
- **Fair Rotation**: Tracks promotion history to ensure all athletes get featured equally
- **AI-Generated Copy**: Creates engaging, personalized write-ups for each athlete
- **Selection Criteria** (rotates weekly):
  - Playbook for Life course progress
  - Recent stats updates
  - Profile engagement and views
  - Media content activity
  - Evaluation performance scores

### 2. Social Media Promotion Calendar
- **Daily Features**: Automatically schedules daily athlete features for upcoming weeks
- **4-Week Planning**: Generate content for 4 weeks at a time
- **AI-Powered Content**: Each post is tailored to the day of the week and athlete's achievements
- **Hashtag Suggestions**: Automatically includes relevant hashtags for better reach
- **Status Tracking**: Monitor which posts are scheduled, posted, or pending

### 3. Media Pack Downloads
- **One-Click Downloads**: Export athlete profile pictures as ZIP files
- **Organized Structure**: Each media pack includes:
  - Profile pictures for each athlete
  - `manifest.json` with athlete details
  - `README.txt` with package information
- **Week-Specific Exports**: Download media for specific weeks or entire calendar

## How It Works

### Athlete of the Week Selection Process
1. System identifies athletes who haven't been featured recently
2. Applies weekly rotating criteria to score athletes fairly
3. Selects highest-scoring athlete from least-featured pool
4. Generates personalized copy using AI based on athlete's achievements
5. Stores selection with rationale for transparency

### Social Calendar Generation
1. Retrieves least-featured athletes for upcoming period
2. Schedules one athlete per day across the calendar
3. Generates day-appropriate content (e.g., Monday motivation, Friday celebration)
4. Creates platform-ready posts with hashtags
5. Updates promotion tracking to maintain fairness

### Fairness Algorithm
- Tracks last featured date for each athlete
- Counts total number of features
- Prioritizes athletes who:
  - Have never been featured (highest priority)
  - Haven't been featured in longest time
  - Have fewer total features
- Bonus points for consistent platform engagement

## Admin Interface

### Athlete of the Week Tab
- View current week's featured athlete
- See selection criteria and rationale
- Review generated copy and hashtags
- Download athlete's media pack
- Force regenerate if needed

### Social Calendar Tab
- Visual calendar showing scheduled posts
- List view of upcoming promotions
- Generate 4 weeks of content with one click
- Download all athlete media as ZIP
- Filter by date range

## Database Structure

### Tables Created
- `athlete_of_week`: Historical record of weekly features
- `social_media_calendar`: Scheduled promotional posts
- `athlete_promotion_history`: Tracks promotion fairness

### Key Functions
- `get_least_featured_athletes()`: Returns athletes due for promotion
- `update_promotion_history()`: Auto-updates tracking when athletes are featured

## API Endpoints

### Edge Functions
1. **generate-athlete-of-week**
   - Generates Athlete of the Week selection
   - Requires admin authentication
   - Can force regenerate with parameter

2. **generate-social-calendar**
   - Creates promotional posts for upcoming weeks
   - Configurable number of weeks ahead
   - Requires admin authentication

3. **download-athlete-media-pack**
   - Creates ZIP file with athlete profile pictures
   - Includes metadata and manifest
   - Requires admin authentication

## Scheduled Automation

### Sunday Morning Cron Job
To enable automatic weekly generation, set up a cron job:

```sql
select cron.schedule(
  'generate-athlete-of-week',
  '0 8 * * 0', -- Every Sunday at 8 AM
  $$
  select net.http_post(
    url:='YOUR_SUPABASE_URL/functions/v1/generate-athlete-of-week',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body:='{"forceGenerate": false}'::jsonb
  ) as request_id;
  $$
);
```

## Best Practices

### Content Strategy
1. Review AI-generated copy before posting
2. Customize hashtags based on current trends
3. Post during peak engagement times
4. Respond to comments and engagement
5. Cross-post to multiple platforms

### Fairness Maintenance
1. Check promotion history monthly
2. Verify all athletes are getting featured
3. Adjust criteria if certain groups are under-represented
4. Consider special features for graduating seniors

### Media Management
1. Ensure all athletes have high-quality profile pictures
2. Update athlete information regularly
3. Archive old promotional content
4. Maintain consistent branding in posts

## Troubleshooting

### No Athletes Selected
- Verify athletes have `visibility = 'public'`
- Check if athletes have required data (stats, course progress, etc.)
- Ensure athlete profiles are complete

### AI Generation Fails
- Check LOVABLE_API_KEY is configured
- Verify sufficient AI credits available
- Review error logs in edge function

### Download Fails
- Confirm athletes have profile pictures uploaded
- Check storage bucket permissions
- Verify file URLs are accessible

## Future Enhancements
- Multi-platform posting integration
- Performance analytics dashboard
- A/B testing for post copy
- Seasonal campaign templates
- Parent/guardian sharing features
