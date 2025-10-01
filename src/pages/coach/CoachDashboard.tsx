import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Evaluation {
  id: string;
  status: string;
  purchased_at: string;
  completed_at: string | null;
  athlete_id: string;
  feedback: string | null;
  rating: number | null;
  athletes: {
    user_id: string;
    sport: string;
    position: string;
    profiles: {
      full_name: string;
    };
  };
}

const CoachDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [coachProfile, setCoachProfile] = useState<any>(null);

  useEffect(() => {
    checkCoachAccess();
  }, []);

  const checkCoachAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user has coach role
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const hasCoachRole = rolesData?.some(r => r.role === "coach");

      if (!hasCoachRole) {
        navigate("/dashboard");
        return;
      }

      // Get coach profile
      const { data: profile } = await supabase
        .from("coach_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      setCoachProfile(profile);

      // Get assigned evaluations
      const { data: evalData, error } = await supabase
        .from("evaluations")
        .select(`
          *,
          athletes!inner (
            user_id,
            sport,
            position
          )
        `)
        .eq("coach_id", session.user.id)
        .order("purchased_at", { ascending: false });

      if (error) throw error;

      // Get athlete profiles separately
      const athleteUserIds = evalData?.map(e => e.athletes.user_id) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", athleteUserIds);

      // Map profiles to evaluations
      const evaluationsWithProfiles = evalData?.map(evaluation => ({
        ...evaluation,
        athletes: {
          ...evaluation.athletes,
          profiles: profilesData?.find(p => p.id === evaluation.athletes.user_id) || { full_name: "Unknown" }
        }
      })) || [];

      setEvaluations(evaluationsWithProfiles);
    } catch (error: any) {
      console.error("Error checking coach access:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Coach Dashboard</h1>
            {coachProfile && <p className="text-sm text-muted-foreground">{coachProfile.full_name}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/coach/profile")}>
              My Profile
            </Button>
            <Button variant="outline" onClick={() => navigate("/coach/available")}>
              Available Evaluations
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{evaluations.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {evaluations.filter(e => e.status === "pending").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {evaluations.filter(e => e.status === "completed").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Evaluations</CardTitle>
            <CardDescription>Athletes you've been assigned to evaluate</CardDescription>
          </CardHeader>
          <CardContent>
            {evaluations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No evaluations assigned yet
              </p>
            ) : (
              <div className="space-y-4">
                {evaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {evaluation.athletes.profiles.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {evaluation.athletes.position} • {evaluation.athletes.sport}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested: {new Date(evaluation.purchased_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(evaluation.status)}
                      <Button 
                        onClick={() => navigate(`/coach/evaluation/${evaluation.id}`)}
                      >
                        {evaluation.status === "completed" ? "View" : "Continue"} Evaluation
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CoachDashboard;
