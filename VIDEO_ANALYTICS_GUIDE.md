# Playbook for Life Video Analytics Guide

## Overview
This system tracks video views and provides detailed analytics for Playbook for Life videos.

## Database Schema

### Table: `playbook_video_views`
Tracks individual video views with the following fields:
- `id`: Unique identifier for the view
- `lesson_id`: Reference to the video (lesson)
- `user_id`: User who viewed the video (nullable for anonymous views)
- `viewed_at`: Timestamp of when the video was viewed
- `watch_duration_seconds`: How long the user watched
- `completed`: Whether the video was completed
- `ip_address`: IP address of the viewer
- `user_agent`: Browser/device information
- `created_at`: Record creation timestamp

### View: `playbook_video_analytics`
Aggregated analytics view providing:
- `lesson_id`: Video identifier
- `video_title`: Name of the video
- `topic_title`: Module/topic name
- `total_views`: Total number of views
- `unique_viewers`: Count of unique users who viewed
- `completed_views`: Number of times video was completed
- `avg_watch_duration`: Average watch time in seconds
- `views_last_7_days`: Views in the past week
- `views_last_30_days`: Views in the past month
- `last_viewed_at`: Most recent view timestamp

### Column: `lessons.view_count`
Quick reference counter that automatically increments on each view via trigger.

## How It Works

### 1. Tracking Views
Views are tracked automatically when:
- A user starts playing a video (tracked via `trackVideoView()`)
- A user marks a video as complete (tracked with duration and completion status)

### 2. Frontend Components

#### Admin Panel (`AdminPlaybookVideos.tsx`)
- Toggle analytics display with "Show Analytics" button
- View aggregate statistics across all videos
- See per-video metrics in the video table
- Analytics include:
  - Total views across all videos
  - Unique viewers
  - Completion counts
  - 7-day view trends

#### Video Player (`VideoPlaylist.tsx`)
- Automatically tracks when a video starts playing
- Records watch duration when video is completed
- Tracks completion status

### 3. Helper Functions (`lib/videoTracking.ts`)

#### `trackVideoView(lessonId, watchDuration?, completed?)`
Records a new video view. Can be called:
- On video start (no duration/completion)
- On video completion (with duration and completion status)

#### `getVideoAnalytics(lessonId)`
Fetches analytics for a specific video.

## Usage Examples

### Track a video view (on play)
```typescript
import { trackVideoView } from "@/lib/videoTracking";

// When video starts playing
trackVideoView(videoId);
```

### Track video completion
```typescript
import { trackVideoView } from "@/lib/videoTracking";

// When user completes video
const watchDuration = 180; // 3 minutes
trackVideoView(videoId, watchDuration, true);
```

### Get video analytics
```typescript
import { getVideoAnalytics } from "@/lib/videoTracking";

const analytics = await getVideoAnalytics(videoId);
console.log(`Total views: ${analytics.total_views}`);
console.log(`Unique viewers: ${analytics.unique_viewers}`);
```

### Query analytics directly
```typescript
const { data, error } = await supabase
  .from("playbook_video_analytics")
  .select("*")
  .order("total_views", { ascending: false })
  .limit(10);
// Get top 10 most viewed videos
```

## Security

### Row Level Security (RLS) Policies
- **Admins**: Can view all video views and analytics
- **Users**: Can view their own video views
- **Anyone**: Can insert new view records (for tracking)

### Privacy Considerations
- User IDs are nullable to allow anonymous tracking
- IP addresses and user agents are stored for fraud prevention
- Personal data follows GDPR guidelines

## Performance

### Indexes
The following indexes optimize query performance:
- `idx_playbook_video_views_lesson_id`: Fast lookups by video
- `idx_playbook_video_views_user_id`: Fast lookups by user
- `idx_playbook_video_views_viewed_at`: Time-based queries

### Automatic Updates
The `view_count` column on `lessons` table updates automatically via trigger, providing fast access to view counts without aggregation queries.

## Future Enhancements
Potential improvements:
1. Real-time analytics dashboard
2. Engagement heatmaps (which parts of videos are watched)
3. Drop-off analysis (where users stop watching)
4. Comparative analytics (video vs video performance)
5. Export analytics to CSV/Excel
6. Email reports for admins
7. User engagement scoring

## Troubleshooting

### Views not tracking?
1. Check browser console for errors
2. Verify RLS policies are enabled
3. Ensure `trackVideoView()` is being called
4. Check network tab for failed requests

### Analytics not showing?
1. Verify data exists in `playbook_video_views` table
2. Check that user has proper permissions
3. Ensure the view `playbook_video_analytics` is accessible
4. Try refreshing the analytics data in admin panel
