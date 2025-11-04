import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, Clock, Loader2, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Evaluation {
  id: string;
  status: string;
  video_url: string;
  purchased_at: string;
  claimed_at: string | null;
  is_reevaluation: boolean;
  requested_coach_id: string | null;
  coach_id: string | null;
  admin_assigned: boolean;
  athlete: {
    user_id: string;
  };
  athlete_profile: {
    full_name: string;
  };
  coach_profile?: {
    full_name: string;
  };
  requested_coach_profile?: {
    full_name: string;
    is_active: boolean;
  };
}

interface Coach {
  user_id: string;
  full_name: string;
  is_active: boolean;
}

export default function AdminEvaluations() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvaluations();
    fetchCoaches();
  }, []);

  const fetchEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from("evaluations")
        .select(`
          *,
          athletes!inner(user_id),
          coach_profile:coach_profiles(full_name),
          requested_coach_profile:coach_profiles!evaluations_requested_coach_id_fkey(full_name, is_active)
        `)
        .order("purchased_at", { ascending: false });

      if (error) throw error;

      // Get unique user IDs to fetch profiles
      const userIds = [...new Set((data || []).map((item: any) => item.athletes?.user_id).filter(Boolean))];
      
      // Fetch profiles for all users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Create a map of user_id to profile
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const formattedData = (data || []).map((item: any) => {
        const profile = profileMap.get(item.athletes?.user_id);
        return {
          ...item,
          athlete: {
            user_id: item.athletes?.user_id,
          },
          athlete_profile: {
            full_name: profile?.full_name || "Unknown",
          },
        };
      });

      setEvaluations(formattedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load evaluations",
        variant: "destructive",
      });
      console.error("Error fetching evaluations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoaches = async () => {
    try {
      const { data, error } = await supabase
        .from("coach_profiles")
        .select("user_id, full_name, is_active")
        .eq("is_active", true)
        .order("full_name");

      if (error) throw error;
      setCoaches(data || []);
    } catch (error) {
      console.error("Error fetching coaches:", error);
    }
  };

  const handleAssignCoach = async (evaluationId: string, coachId: string) => {
    setAssigningId(evaluationId);
    try {
      const { error } = await supabase
        .from("evaluations")
        .update({
          coach_id: coachId,
          admin_assigned: true,
          status: "in_progress",
        })
        .eq("id", evaluationId);

      if (error) throw error;

      // Notify the coach
      await supabase.functions.invoke("notify-coaches-new-evaluation", {
        body: {
          evaluation_id: evaluationId,
          is_reevaluation: evaluations.find((e) => e.id === evaluationId)?.is_reevaluation || false,
          coach_id: coachId,
        },
      });

      toast({
        title: "Coach Assigned",
        description: "The evaluation has been assigned to the coach",
      });

      fetchEvaluations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign coach",
        variant: "destructive",
      });
    } finally {
      setAssigningId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; icon: any; variant: "secondary" | "default" | "destructive" }> = {
      pending: { label: "Pending", icon: Clock, variant: "secondary" },
      in_progress: { label: "In Progress", icon: AlertCircle, variant: "default" },
      completed: { label: "Completed", icon: CheckCircle, variant: "default" },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const needsAssignment = (evaluation: Evaluation) => {
    return (
      evaluation.status === "pending" &&
      !evaluation.coach_id &&
      evaluation.requested_coach_id &&
      (!evaluation.requested_coach_profile?.is_active)
    );
  };

  const isStaleUnpicked = (evaluation: Evaluation) => {
    if (evaluation.status !== "pending" || evaluation.coach_id) return false;
    const hoursSince = (Date.now() - new Date(evaluation.purchased_at).getTime()) / (1000 * 60 * 60);
    return hoursSince >= 48;
  };

  const isStaleUncompleted = (evaluation: Evaluation) => {
    if (evaluation.status !== "in_progress" || !evaluation.claimed_at) return false;
    const hoursSince = (Date.now() - new Date(evaluation.claimed_at).getTime()) / (1000 * 60 * 60);
    return hoursSince >= 48;
  };

  const filterEvaluations = (status?: string) => {
    if (!status) return evaluations;
    return evaluations.filter((e) => e.status === status);
  };

  const needsAssignmentEvaluations = evaluations.filter(needsAssignment);
  const staleUnpickedEvaluations = evaluations.filter(isStaleUnpicked);
  const staleUncompletedEvaluations = evaluations.filter(isStaleUncompleted);

  const EvaluationCard = ({ evaluation }: { evaluation: Evaluation }) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                {evaluation.athlete_profile.full_name}
              </CardTitle>
              {evaluation.is_reevaluation && (
                <Badge variant="secondary">Re-evaluation</Badge>
              )}
            </div>
            <CardDescription>
              Purchased {new Date(evaluation.purchased_at).toLocaleDateString()}
            </CardDescription>
          </div>
          {getStatusBadge(evaluation.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {evaluation.video_url && (
          <div>
            <p className="text-sm font-medium mb-1">Video URL</p>
            <a
              href={evaluation.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {evaluation.video_url}
            </a>
          </div>
        )}

        {evaluation.requested_coach_id && evaluation.requested_coach_profile && (
          <div>
            <p className="text-sm font-medium mb-1">Requested Coach</p>
            <div className="flex items-center gap-2">
              <p className="text-sm">
                {evaluation.requested_coach_profile.full_name}
              </p>
              {!evaluation.requested_coach_profile.is_active && (
                <Badge variant="destructive" className="text-xs">Unavailable</Badge>
              )}
            </div>
          </div>
        )}

        {evaluation.coach_id && evaluation.coach_profile && (
          <div>
            <p className="text-sm font-medium mb-1">Assigned Coach</p>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              <p className="text-sm">{evaluation.coach_profile.full_name}</p>
              {evaluation.admin_assigned && (
                <Badge variant="outline" className="text-xs">Admin Assigned</Badge>
              )}
            </div>
          </div>
        )}

        {needsAssignment(evaluation) && (
          <div className="pt-4 space-y-2">
            <p className="text-sm font-medium text-destructive">
              Requested coach unavailable - assign a new coach
            </p>
            <Select
              onValueChange={(coachId) => handleAssignCoach(evaluation.id, coachId)}
              disabled={assigningId === evaluation.id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a coach..." />
              </SelectTrigger>
              <SelectContent>
                {coaches.map((coach) => (
                  <SelectItem key={coach.user_id} value={coach.user_id}>
                    {coach.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assigningId === evaluation.id && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Assigning coach...
              </div>
            )}
          </div>
        )}

        {!evaluation.coach_id && !needsAssignment(evaluation) && evaluation.status === "pending" && (
          <div className="pt-4 space-y-2">
            <p className="text-sm font-medium">Assign Coach</p>
            <Select
              onValueChange={(coachId) => handleAssignCoach(evaluation.id, coachId)}
              disabled={assigningId === evaluation.id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a coach..." />
              </SelectTrigger>
              <SelectContent>
                {coaches.map((coach) => (
                  <SelectItem key={coach.user_id} value={coach.user_id}>
                    {coach.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {evaluation.coach_id && evaluation.status === "in_progress" && (
          <div className="pt-4 space-y-2">
            <p className="text-sm font-medium">Reassign Coach</p>
            <Select
              onValueChange={(coachId) => handleAssignCoach(evaluation.id, coachId)}
              disabled={assigningId === evaluation.id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a different coach..." />
              </SelectTrigger>
              <SelectContent>
                {coaches.map((coach) => (
                  <SelectItem key={coach.user_id} value={coach.user_id}>
                    {coach.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Manage Evaluations</h1>
        <p className="text-muted-foreground">
          Assign coaches to evaluations and monitor progress
        </p>
      </div>

      {needsAssignmentEvaluations.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Needs Coach Assignment ({needsAssignmentEvaluations.length})
            </CardTitle>
            <CardDescription>
              These evaluations need a coach assigned because the requested coach is unavailable
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {needsAssignmentEvaluations.map((evaluation) => (
              <EvaluationCard key={evaluation.id} evaluation={evaluation} />
            ))}
          </CardContent>
        </Card>
      )}

      {staleUnpickedEvaluations.length > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="text-orange-500 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Not Picked Up - 48+ Hours ({staleUnpickedEvaluations.length})
            </CardTitle>
            <CardDescription>
              These evaluations have not been picked up by any coach for over 48 hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {staleUnpickedEvaluations.map((evaluation) => (
              <EvaluationCard key={evaluation.id} evaluation={evaluation} />
            ))}
          </CardContent>
        </Card>
      )}

      {staleUncompletedEvaluations.length > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="text-orange-500 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Not Completed - 48+ Hours ({staleUncompletedEvaluations.length})
            </CardTitle>
            <CardDescription>
              These evaluations have been assigned but not completed for over 48 hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {staleUncompletedEvaluations.map((evaluation) => (
              <EvaluationCard key={evaluation.id} evaluation={evaluation} />
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All ({evaluations.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({filterEvaluations("pending").length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({filterEvaluations("in_progress").length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({filterEvaluations("completed").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {evaluations.map((evaluation) => (
            <EvaluationCard key={evaluation.id} evaluation={evaluation} />
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {filterEvaluations("pending").map((evaluation) => (
            <EvaluationCard key={evaluation.id} evaluation={evaluation} />
          ))}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4 mt-6">
          {filterEvaluations("in_progress").map((evaluation) => (
            <EvaluationCard key={evaluation.id} evaluation={evaluation} />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {filterEvaluations("completed").map((evaluation) => (
            <EvaluationCard key={evaluation.id} evaluation={evaluation} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
