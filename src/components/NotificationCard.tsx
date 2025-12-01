import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  link: string | null;
}

export default function NotificationCard() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    subscribeToNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notification-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification.id);
    }

    // Track viewed_at timestamp for analytics
    await supabase
      .from("notifications")
      .update({ viewed_at: new Date().toISOString() })
      .eq("id", notification.id)
      .is("viewed_at", null);

    // Track click if there's a link
    if (notification.link) {
      await supabase
        .from("notifications")
        .update({ clicked_at: new Date().toISOString() })
        .eq("id", notification.id)
        .is("clicked_at", null);
      
      navigate(notification.link);
    } else {
      navigate("/notifications");
    }
  };

  const truncateMessage = (message: string, length: number = 80) => {
    return message.length > length ? `${message.substring(0, length)}...` : message;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'update':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'announcement':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'reminder':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/notifications")}
          >
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Recent updates and announcements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                !notification.is_read && "bg-primary/5 border-primary/20"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className={cn(
                  "text-sm font-medium",
                  !notification.is_read && "font-semibold"
                )}>
                  {notification.title}
                </h4>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs capitalize shrink-0", getTypeColor(notification.type))}
                >
                  {notification.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {truncateMessage(notification.message)}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {new Date(notification.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
