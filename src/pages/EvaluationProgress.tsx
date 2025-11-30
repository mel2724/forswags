import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, TrendingUp, FileText } from "lucide-react";
import { EvaluationProgressChart } from "@/components/EvaluationProgressChart";
import { SkillAssessmentMatrix } from "@/components/SkillAssessmentMatrix";
import { toast } from "sonner";

interface Evaluation {
  id: string;
  completed_at: string;
  scores: Record<string, number>;
  feedback: string | null;
  coach_id: string | null;
}

interface Criterion {
  id: string;
  name: string;
  description: string;
  category: string;
  max_score: number;
  order_index: number;
}

export default function EvaluationProgress() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get athlete ID
      const { data: athleteData } = await supabase
        .from("athletes")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!athleteData) {
        toast.error("Athlete profile not found");
        navigate("/dashboard");
        return;
      }

      // Fetch completed evaluations
      const { data: evaluationsData, error: evalError } = await supabase
        .from("evaluations")
        .select("id, completed_at, scores, feedback, coach_id")
        .eq("athlete_id", athleteData.id)
        .eq("status", "completed")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: true });

      if (evalError) throw evalError;

      const typedEvaluations = (evaluationsData || []).map(item => ({
        ...item,
        scores: (item.scores || {}) as Record<string, number>,
        completed_at: item.completed_at!
      }));

      setEvaluations(typedEvaluations);

      if (typedEvaluations.length > 0) {
        setSelectedEvaluationId(typedEvaluations[typedEvaluations.length - 1].id);
      }

      // Fetch evaluation criteria
      const { data: criteriaData, error: criteriaError } = await supabase
        .from("evaluation_criteria")
        .select("*")
        .order("order_index");

      if (criteriaError) throw criteriaError;
      setCriteria(criteriaData || []);

    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load evaluation data");
    } finally {
      setLoading(false);
    }
  };

  const selectedEvaluation = evaluations.find(e => e.id === selectedEvaluationId);
  const previousEvaluation = evaluations.length > 1 && selectedEvaluation
    ? evaluations[evaluations.indexOf(selectedEvaluation) - 1]
    : undefined;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate("/evaluations")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Evaluations
        </Button>

        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Completed Evaluations</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              You need at least one completed evaluation to track your progress. Purchase and complete an evaluation to get started.
            </p>
            <Button onClick={() => navigate("/evaluations/purchase")}>
              Purchase Evaluation
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/evaluations")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Evaluations
        </Button>
      </div>

      <div>
        <h1 className="text-4xl font-bold mb-2">Progress Tracking</h1>
        <p className="text-muted-foreground">
          Track your development across {evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''}
        </p>
      </div>

      <Tabs defaultValue="charts" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="charts">
            <TrendingUp className="h-4 w-4 mr-2" />
            Progress Charts
          </TabsTrigger>
          <TabsTrigger value="detailed">
            <FileText className="h-4 w-4 mr-2" />
            Detailed Scores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <EvaluationProgressChart evaluations={evaluations} criteria={criteria} />
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm font-medium">Select Evaluation:</label>
            <select
              className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedEvaluationId || ''}
              onChange={(e) => setSelectedEvaluationId(e.target.value)}
            >
              {evaluations.map((evaluation, index) => (
                <option key={evaluation.id} value={evaluation.id}>
                  Evaluation #{index + 1} - {new Date(evaluation.completed_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {selectedEvaluation && (
            <SkillAssessmentMatrix
              criteria={criteria}
              scores={selectedEvaluation.scores}
              onScoreChange={() => {}}
              isReadOnly={true}
              previousScores={previousEvaluation?.scores}
            />
          )}

          {selectedEvaluation?.feedback && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Coach Feedback</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedEvaluation.feedback}
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Completed on {new Date(selectedEvaluation.completed_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}