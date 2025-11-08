import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";

/**
 * Hook to listen for real-time badge achievements
 * Shows notification when user earns a new badge
 */
export const useBadgeListener = (userId: string | undefined) => {
  const { showBadgeNotification } = useBadgeNotification();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to new badge insertions for this user
    const channel = supabase
      .channel('user-badges-listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          // Fetch the complete badge details
          const { data: badgeData } = await supabase
            .from('badges')
            .select('id, name, description, icon_url')
            .eq('id', payload.new.badge_id)
            .single();

          if (badgeData) {
            showBadgeNotification(badgeData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, showBadgeNotification]);
};
