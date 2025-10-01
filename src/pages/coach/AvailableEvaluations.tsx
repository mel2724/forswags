import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Video, User, Calendar, Clock } from "lucide-react";

interface AvailableEvaluation {
  id: string;
  video_url: string;
  purchased_at: string;
  athlete_id: string;
  athletes: {
    sport: string;
    position: string;
    profiles: {
      full_name: string;
    };
  };
}

export default function AvailableEvaluations() {
  const [evaluations, setEvaluations] = useState<AvailableEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailableEvaluations();
  }, []);

  const fetchAvailableEvaluations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get coach profile to check specializations
      const { data: coachProfile } = await supabase
        .from("coach_profiles")
        .select("specializations")
        .eq("user_id", user.id)
        .single();

      // Fetch unclaimed evaluations with video
      const { data, error } = await supabase
        .from("evaluations")
        .select(`
          *,
          athletes!inner (
            sport,
            position,
            user_id
          )
        `)
        .is("coach_id", null)
        .not("video_url", "is", null)
        .eq("status", "pending")
        .order("purchased_at", { ascending: true });

      if (error) throw error;

      // Filter by specializations if coach has any
      let filteredData = data || [];
      if (coachProfile?.specializations && coachProfile.specializations.length > 0) {
        filteredData = data?.filter(evaluation => {
          const sport = evaluation.athletes.sport;
          return coachProfile.specializations.some((spec: string) =>
            sport.toLowerCase().includes(spec.toLowerCase())
          );
        }) || [];
      }

      // Get athlete profiles
      const athleteUserIds = filteredData?.map(e => e.athletes.user_id) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", athleteUserIds);

      const evaluationsWithProfiles = filteredData?.map(evaluation => ({
        ...evaluation,
        athletes: {
          ...evaluation.athletes,
          profiles: profilesData?.find(p => p.id === evaluation.athletes.user_id) || { full_name: "Unknown" }
        }
      })) || [];

      setEvaluations(evaluationsWithProfiles);
    } catch (error: any) {
      console.error("Error fetching evaluations:", error);
      toast({
        title: "Error",
        description: "Failed to load available evaluations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimEvaluation = async (evaluationId: string) => {
    setClaimingId(evaluationId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("evaluations")
        .update({
          coach_id: user.id,
          status: "in_progress",
          claimed_at: new Date().toISOString()
        })
        .eq("id", evaluationId)
        .is("coach_id", null); // Ensure it hasn't been claimed by someone else

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Evaluation claimed. You can now start reviewing.",
      });

      navigate(`/coach/evaluation/${evaluationId}`);
    } catch (error: any) {
      console.error("Claim error:", error);
      toast({
        title: "Error",
        description: "Failed to claim evaluation. It may have been claimed by another coach.",
        variant: "destructive",
      });
      fetchAvailableEvaluations();
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading evaluations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Available Evaluations</h1>
        <p className="text-muted-foreground mb-6">
          Claim evaluations to review athlete highlight videos
        </p>
      </div>

      {evaluations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No evaluations available</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Check back later for new evaluation requests from athletes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {evaluations.map((evaluation) => (
            <Card key={evaluation.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {evaluation.athletes.profiles.full_name}
                    </CardTitle>
                    <CardDescription>
                      {evaluation.athletes.position} • {evaluation.athletes.sport}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    <Video className="h-3 w-3 mr-1" />
                    Video
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Submitted {new Date(evaluation.purchased_at).toLocaleDateString()}
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleClaimEvaluation(evaluation.id)}
                  disabled={claimingId === evaluation.id}
                >
                  {claimingId === evaluation.id ? "Claiming..." : "Claim Evaluation"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
