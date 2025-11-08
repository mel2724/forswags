import { supabase } from "@/integrations/supabase/client";

/**
 * Track a video view in the playbook_video_views table
 * @param lessonId - The ID of the lesson/video being viewed
 * @param watchDuration - Duration watched in seconds (optional)
 * @param completed - Whether the video was completed (optional)
 */
export const trackVideoView = async (
  lessonId: string,
  watchDuration?: number,
  completed?: boolean
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("playbook_video_views").insert({
      lesson_id: lessonId,
      user_id: user?.id || null,
      watch_duration_seconds: watchDuration,
      completed: completed || false,
    });

    if (error) {
      console.error("Error tracking video view:", error);
    }
  } catch (error) {
    console.error("Error tracking video view:", error);
  }
};

/**
 * Update a video view with watch duration and completion status
 * @param viewId - The ID of the view to update
 * @param watchDuration - Duration watched in seconds
 * @param completed - Whether the video was completed
 */
export const updateVideoView = async (
  viewId: string,
  watchDuration: number,
  completed: boolean
) => {
  try {
    const { error } = await supabase
      .from("playbook_video_views")
      .update({
        watch_duration_seconds: watchDuration,
        completed,
      })
      .eq("id", viewId);

    if (error) {
      console.error("Error updating video view:", error);
    }
  } catch (error) {
    console.error("Error updating video view:", error);
  }
};

/**
 * Get video analytics for a specific lesson
 * @param lessonId - The ID of the lesson
 */
export const getVideoAnalytics = async (lessonId: string) => {
  try {
    const { data, error } = await supabase
      .from("playbook_video_analytics")
      .select("*")
      .eq("lesson_id", lessonId)
      .single();

    if (error) {
      console.error("Error fetching video analytics:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching video analytics:", error);
    return null;
  }
};
