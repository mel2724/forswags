import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TrackProfileViewOptions {
  athleteId: string;
  viewerType: "recruiter" | "coach" | "athlete" | "parent" | "anonymous";
}

export function useProfileTracking({ athleteId, viewerType }: TrackProfileViewOptions) {
  useEffect(() => {
    trackProfileView();
  }, [athleteId]);

  const trackProfileView = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Don't track if viewing own profile
      const { data: athleteData } = await supabase
        .from("athletes")
        .select("user_id")
        .eq("id", athleteId)
        .single();

      if (athleteData?.user_id === user.id) return;

      // Track the view
      await supabase.from("profile_views").insert({
        athlete_id: athleteId,
        viewer_id: user.id,
        viewer_type: viewerType,
        session_id: sessionStorage.getItem("session_id") || undefined,
        referrer: document.referrer || undefined,
      });
    } catch (error) {
      console.error("Error tracking profile view:", error);
    }
  };

  return { trackProfileView };
}

interface TrackEngagementOptions {
  contentType: "profile" | "media" | "social_post" | "highlight";
  contentId: string;
  actionType: "view" | "share" | "download" | "click" | "like";
  metadata?: Record<string, any>;
}

export async function trackEngagement({
  contentType,
  contentId,
  actionType,
  metadata,
}: TrackEngagementOptions) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("engagement_metrics").insert({
      user_id: user.id,
      content_type: contentType,
      content_id: contentId,
      action_type: actionType,
      metadata: metadata || null,
    });
  } catch (error) {
    console.error("Error tracking engagement:", error);
  }
}

interface TrackSearchOptions {
  searchType: "athlete" | "school" | "coach";
  filters: Record<string, any>;
  resultsCount: number;
  clickedResultIds?: string[];
}

export async function trackSearch({
  searchType,
  filters,
  resultsCount,
  clickedResultIds,
}: TrackSearchOptions) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("search_analytics").insert({
      user_id: user.id,
      search_type: searchType,
      filters,
      results_count: resultsCount,
      clicked_result_ids: clickedResultIds || [],
    });
  } catch (error) {
    console.error("Error tracking search:", error);
  }
}
