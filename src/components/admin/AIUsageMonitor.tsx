import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Zap
} from "lucide-react";
import { format } from "date-fns";

export function AIUsageMonitor() {
  // Fetch daily usage stats
  const { data: dailyStats, isLoading: statsLoading } = useQuery({
    queryKey: ["ai-daily-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_daily_ai_usage");
      if (error) throw error;
      return data as Array<{
        date: string;
        total_requests: number;
        successful_requests: number;
        failed_requests: number;
        rate_limited_requests: number;
        unique_users: number;
        estimated_tokens: number;
      }>;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch active alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["ai-usage-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_usage_alerts")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Fetch recent logs
  const { data: recentLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["ai-recent-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_usage_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const resolveAlert = async (alertId: string) => {
    const { error } = await supabase
      .from("ai_usage_alerts")
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq("id", alertId);

    if (!error) {
      // Refetch alerts
      await supabase
        .from("ai_usage_alerts")
        .select("*")
        .eq("resolved", false);
    }
  };

  const todayStats = dailyStats?.[0];
  const yesterdayStats = dailyStats?.[1];

  const calculateChange = (current?: number, previous?: number) => {
    if (!current || !previous) return null;
    const change = ((current - previous) / previous) * 100;
    return change.toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">AI Usage Monitoring</h2>
        <p className="text-muted-foreground">
          Track AI request volume, costs, and performance across all features
        </p>
      </div>

      {/* Active Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Active Alerts ({alerts.length})
          </h3>
          {alerts.map((alert) => (
            <Alert key={alert.id} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                <span>{alert.alert_type.replace(/_/g, " ").toUpperCase()}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resolveAlert(alert.id)}
                >
                  Resolve
                </Button>
              </AlertTitle>
              <AlertDescription>
                {alert.alert_message}
                <div className="text-xs mt-2 text-muted-foreground">
                  {format(new Date(alert.created_at), "PPp")}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Requests</p>
              <p className="text-3xl font-bold mt-2">
                {statsLoading ? "..." : todayStats?.total_requests || 0}
              </p>
              {yesterdayStats && (
                <p className="text-xs text-muted-foreground mt-1">
                  {calculateChange(todayStats?.total_requests, yesterdayStats?.total_requests)}% vs yesterday
                </p>
              )}
            </div>
            <Activity className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <p className="text-3xl font-bold mt-2">
                {statsLoading ? "..." : 
                  todayStats ? 
                    `${((todayStats.successful_requests / todayStats.total_requests) * 100).toFixed(1)}%` 
                    : "0%"
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {todayStats?.successful_requests || 0} successful
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rate Limits</p>
              <p className="text-3xl font-bold mt-2">
                {statsLoading ? "..." : todayStats?.rate_limited_requests || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Rate limit hits today
              </p>
            </div>
            <Clock className="h-8 w-8 text-warning" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Unique Users</p>
              <p className="text-3xl font-bold mt-2">
                {statsLoading ? "..." : todayStats?.unique_users || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Active users today
              </p>
            </div>
            <Users className="h-8 w-8 text-info" />
          </div>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Stats</TabsTrigger>
          <TabsTrigger value="logs">Recent Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Last 30 Days</h3>
            <div className="space-y-3">
              {statsLoading ? (
                <p className="text-muted-foreground">Loading stats...</p>
              ) : (
                dailyStats?.slice(0, 14).map((stat) => (
                  <div key={stat.date} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-medium">{format(new Date(stat.date), "MMM d, yyyy")}</p>
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-success" />
                          {stat.successful_requests} success
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-destructive" />
                          {stat.failed_requests} failed
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-warning" />
                          {stat.rate_limited_requests} rate limited
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{stat.total_requests}</p>
                      <p className="text-xs text-muted-foreground">
                        ~{stat.estimated_tokens.toLocaleString()} tokens
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-2">
              {logsLoading ? (
                <p className="text-muted-foreground">Loading logs...</p>
              ) : (
                recentLogs?.map((log) => (
                  <div key={log.id} className="flex items-center justify-between border-b pb-2 text-sm">
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        log.status === "success" ? "default" :
                        log.status === "rate_limit" ? "secondary" :
                        log.status === "insufficient_credits" ? "destructive" :
                        "outline"
                      }>
                        {log.status}
                      </Badge>
                      <span className="font-medium">{log.function_name}</span>
                      <span className="text-muted-foreground">{log.request_type}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "HH:mm:ss")}
                      </p>
                      {log.tokens_estimated && (
                        <p className="text-xs text-muted-foreground">
                          ~{log.tokens_estimated} tokens
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
