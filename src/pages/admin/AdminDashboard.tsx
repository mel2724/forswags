import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trophy, GraduationCap, School, TrendingUp, RefreshCw } from "lucide-react";
import { UserActivityHeatmap } from "@/components/admin/UserActivityHeatmap";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAthletes: 0,
    totalCourses: 0,
    totalSchools: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pendingAnalyses, setPendingAnalyses] = useState<any[]>([]);
  const [triggering, setTriggering] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchPendingAnalyses();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, athletesRes, coursesRes, schoolsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("athletes").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("schools").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalAthletes: athletesRes.count || 0,
        totalCourses: coursesRes.count || 0,
        totalSchools: schoolsRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from("athletes")
        .select(`
          id,
          sport,
          position,
          analysis_requested_at,
          profiles!inner(full_name, email)
        `)
        .not("analysis_requested_at", "is", null)
        .is("analysis_notified_at", null)
        .order("analysis_requested_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setPendingAnalyses(data || []);
    } catch (error) {
      console.error("Error fetching pending analyses:", error);
    }
  };

  const handleTriggerAnalysis = async (athleteId: string) => {
    setTriggering(athleteId);
    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-trigger-college-analysis",
        { body: { athleteId } }
      );

      if (error) throw error;

      toast.success("Analysis triggered successfully!");
      fetchPendingAnalyses(); // Refresh the list
    } catch (error: any) {
      console.error("Error triggering analysis:", error);
      toast.error(error.message || "Failed to trigger analysis");
    } finally {
      setTriggering(null);
    }
  };

  if (loading) {
    return <div>Loading statistics...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your platform and monitor key metrics
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Athletes</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAthletes}</div>
            <p className="text-xs text-muted-foreground">Active athlete profiles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Available courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchools}</div>
            <p className="text-xs text-muted-foreground">College partners</p>
          </CardContent>
        </Card>
      </div>

      {/* User Activity Heatmap */}
      <UserActivityHeatmap />

      {/* Pending College Match Analyses */}
      {pendingAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending College Match Analyses</CardTitle>
            <CardDescription>
              Athletes awaiting Prime Dime college match analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingAnalyses.map((athlete) => {
                const profile = Array.isArray(athlete.profiles) ? athlete.profiles[0] : athlete.profiles;
                return (
                  <div key={athlete.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{profile?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {athlete.sport} {athlete.position && `• ${athlete.position}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested: {new Date(athlete.analysis_requested_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleTriggerAnalysis(athlete.id)}
                      disabled={triggering === athlete.id}
                    >
                      {triggering === athlete.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Trigger Analysis
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use the sidebar to navigate to different management sections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Platform health overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm">All systems operational</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
