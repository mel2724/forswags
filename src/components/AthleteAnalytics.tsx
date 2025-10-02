import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, TrendingUp, Users, Share2, Download, Calendar } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ProfileViewStats {
  total_views: number;
  unique_viewers: number;
  recruiter_views: number;
  coach_views: number;
  recent_views: Array<{
    viewer_id: string;
    viewer_type: string;
    viewed_at: string;
  }>;
}

interface EngagementStats {
  total_engagements: number;
  views: number;
  shares: number;
  downloads: number;
  engagement_by_type: Record<string, number>;
}

interface RecentView {
  id: string;
  viewer_type: string;
  viewed_at: string;
  viewer_id: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export function AthleteAnalytics() {
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [viewStats, setViewStats] = useState<ProfileViewStats | null>(null);
  const [engagementStats, setEngagementStats] = useState<EngagementStats | null>(null);
  const [recentViews, setRecentViews] = useState<RecentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("30");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get athlete ID
      const { data: athleteData } = await supabase
        .from("athletes")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!athleteData) return;
      setAthleteId(athleteData.id);

      // Get profile view stats
      const { data: viewData, error: viewError } = await supabase
        .rpc("get_profile_view_stats", {
          p_athlete_id: athleteData.id,
          p_days: parseInt(timeRange),
        });

      if (viewError) throw viewError;
      if (viewData && viewData.length > 0) {
        const stats = viewData[0];
        setViewStats({
          total_views: Number(stats.total_views),
          unique_viewers: Number(stats.unique_viewers),
          recruiter_views: Number(stats.recruiter_views),
          coach_views: Number(stats.coach_views),
          recent_views: (stats.recent_views as any[]) || [],
        });
      }

      // Get engagement stats
      const { data: engagementData, error: engagementError } = await supabase
        .rpc("get_engagement_stats", {
          p_user_id: user.id,
          p_days: parseInt(timeRange),
        });

      if (engagementError) throw engagementError;
      if (engagementData && engagementData.length > 0) {
        const stats = engagementData[0];
        setEngagementStats({
          total_engagements: Number(stats.total_engagements),
          views: Number(stats.views),
          shares: Number(stats.shares),
          downloads: Number(stats.downloads),
          engagement_by_type: typeof stats.engagement_by_type === 'object' && stats.engagement_by_type !== null 
            ? stats.engagement_by_type as Record<string, number>
            : {},
        });
      }

      // Get recent profile views with viewer details
      const { data: recentViewsData } = await supabase
        .from("profile_views")
        .select(`
          id,
          viewer_type,
          viewed_at,
          viewer_id
        `)
        .eq("athlete_id", athleteData.id)
        .gte("viewed_at", new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString())
        .order("viewed_at", { ascending: false })
        .limit(10);

      if (recentViewsData) {
        // Get viewer profiles separately
        const viewerIds = recentViewsData.map(v => v.viewer_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", viewerIds);

        const viewsWithProfiles = recentViewsData.map(view => ({
          ...view,
          profiles: profilesData?.find(p => p.id === view.viewer_id) || null,
        }));

        setRecentViews(viewsWithProfiles as RecentView[]);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  const StatCard = ({ title, value, icon: Icon, description }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value || 0}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profile Analytics</h2>
          <p className="text-muted-foreground">Track your profile performance and engagement</p>
        </div>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <TabsList>
            <TabsTrigger value="7">7 days</TabsTrigger>
            <TabsTrigger value="30">30 days</TabsTrigger>
            <TabsTrigger value="90">90 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Views"
          value={viewStats?.total_views}
          icon={Eye}
          description="Profile views in selected period"
        />
        <StatCard
          title="Unique Viewers"
          value={viewStats?.unique_viewers}
          icon={Users}
          description="Different people who viewed"
        />
        <StatCard
          title="Recruiter Views"
          value={viewStats?.recruiter_views}
          icon={TrendingUp}
          description="Views from recruiters"
        />
        <StatCard
          title="Total Engagement"
          value={engagementStats?.total_engagements}
          icon={Share2}
          description="All interactions with content"
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="views" className="space-y-4">
        <TabsList>
          <TabsTrigger value="views">Recent Views</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="interest">College Interest</TabsTrigger>
        </TabsList>

        <TabsContent value="views" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Profile Views</CardTitle>
              <CardDescription>
                Who's been checking out your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentViews.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No profile views yet
                </p>
              ) : (
                <div className="space-y-4">
                  {recentViews.map((view) => (
                    <div
                      key={view.id}
                      className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={view.profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            {view.profiles?.full_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {view.profiles?.full_name || "Anonymous"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="capitalize">
                              {view.viewer_type}
                            </Badge>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(view.viewed_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  {engagementStats?.views || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Shares</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  {engagementStats?.shares || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Downloads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  {engagementStats?.downloads || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {engagementStats?.engagement_by_type && (
            <Card>
              <CardHeader>
                <CardTitle>Engagement by Content Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(engagementStats.engagement_by_type).map(
                    ([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between"
                      >
                        <span className="capitalize">{type.replace("_", " ")}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="interest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>College Interest Indicators</CardTitle>
              <CardDescription>
                Schools and recruiters showing interest in your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Recruiter Profile Views</p>
                    <p className="text-sm text-muted-foreground">
                      {viewStats?.recruiter_views || 0} views from college recruiters
                    </p>
                  </div>
                  <Badge variant="secondary">{viewStats?.recruiter_views || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Coach Profile Views</p>
                    <p className="text-sm text-muted-foreground">
                      {viewStats?.coach_views || 0} views from coaches
                    </p>
                  </div>
                  <Badge variant="secondary">{viewStats?.coach_views || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
