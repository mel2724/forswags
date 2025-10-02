import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Users, TrendingUp, BookmarkCheck, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface SearchHistory {
  id: string;
  search_type: string;
  filters: any;
  results_count: number;
  clicked_result_ids: string[];
  created_at: string;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: any;
  created_at: string;
}

export function RecruiterAnalytics() {
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [stats, setStats] = useState({
    totalSearches: 0,
    athletesViewed: 0,
    savedSearches: 0,
    evaluationsRequested: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("30");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const daysAgo = new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000);

      // Get search history
      const { data: searchData } = await supabase
        .from("search_analytics")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", daysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(20);

      if (searchData) {
        setSearchHistory(searchData);
      }

      // Get saved searches
      const { data: savedData } = await supabase
        .from("saved_searches")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (savedData) {
        setSavedSearches(savedData);
      }

      // Calculate stats
      const totalSearches = searchData?.length || 0;
      const athletesViewed = new Set(
        searchData?.flatMap((s) => s.clicked_result_ids || [])
      ).size;
      const savedSearchesCount = savedData?.length || 0;

      // Get evaluation count
      const { count: evaluationsCount } = await supabase
        .from("evaluations")
        .select("id", { count: "exact", head: true })
        .eq("coach_id", user.id)
        .gte("created_at", daysAgo.toISOString());

      setStats({
        totalSearches,
        athletesViewed,
        savedSearches: savedSearchesCount,
        evaluationsRequested: evaluationsCount || 0,
      });
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
        <div className="text-2xl font-bold">{value}</div>
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
          <h2 className="text-2xl font-bold">Recruiting Analytics</h2>
          <p className="text-muted-foreground">Track your recruiting activity and ROI</p>
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
          title="Total Searches"
          value={stats.totalSearches}
          icon={Search}
          description="Athlete searches performed"
        />
        <StatCard
          title="Athletes Viewed"
          value={stats.athletesViewed}
          icon={Users}
          description="Unique profiles clicked"
        />
        <StatCard
          title="Saved Searches"
          value={stats.savedSearches}
          icon={BookmarkCheck}
          description="Active saved searches"
        />
        <StatCard
          title="Evaluations"
          value={stats.evaluationsRequested}
          icon={TrendingUp}
          description="Evaluation requests"
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Search History</TabsTrigger>
          <TabsTrigger value="saved">Saved Searches</TabsTrigger>
          <TabsTrigger value="pipeline">Evaluation Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Searches</CardTitle>
              <CardDescription>
                Your athlete search activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchHistory.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No searches yet
                </p>
              ) : (
                <div className="space-y-4">
                  {searchHistory.map((search) => (
                    <div
                      key={search.id}
                      className="flex items-start justify-between border-b last:border-0 pb-4 last:pb-0"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">
                            {search.search_type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {search.results_count} results
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Object.entries(search.filters || {}).map(
                            ([key, value]) =>
                              value && (
                                <span key={key} className="mr-2">
                                  {key}: {String(value)}
                                </span>
                              )
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(search.created_at), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                      {search.clicked_result_ids?.length > 0 && (
                        <Badge variant="outline">
                          {search.clicked_result_ids.length} clicked
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Searches</CardTitle>
              <CardDescription>
                Quick access to your frequent searches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedSearches.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No saved searches yet
                </p>
              ) : (
                <div className="space-y-4">
                  {savedSearches.map((search) => (
                    <div
                      key={search.id}
                      className="flex items-start justify-between border-b last:border-0 pb-4 last:pb-0"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{search.name}</p>
                        <div className="text-xs text-muted-foreground">
                          {Object.entries(search.filters || {}).map(
                            ([key, value]) =>
                              value && (
                                <span key={key} className="mr-2">
                                  {key}: {String(value)}
                                </span>
                              )
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Created{" "}
                          {formatDistanceToNow(new Date(search.created_at), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Pipeline</CardTitle>
              <CardDescription>
                Track your evaluation requests and ROI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Total Evaluations</p>
                    <p className="text-sm text-muted-foreground">
                      Evaluation requests in this period
                    </p>
                  </div>
                  <Badge variant="secondary">{stats.evaluationsRequested}</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Search to View Ratio</p>
                    <p className="text-sm text-muted-foreground">
                      Efficiency of your searches
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {stats.totalSearches > 0
                      ? Math.round((stats.athletesViewed / stats.totalSearches) * 100)
                      : 0}
                    %
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
