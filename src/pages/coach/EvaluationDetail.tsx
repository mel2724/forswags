import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, User, Award } from "lucide-react";
import VideoAnnotation from "@/components/VideoAnnotation";

interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  max_score: number;
  category: string;
}

interface EvaluationDetail {
  id: string;
  video_url: string;
  status: string;
  feedback: string | null;
  scores: Record<string, number>;
  athlete_id: string;
  athletes: {
    sport: string;
    position: string;
    user_id: string;
    profiles: {
      full_name: string;
    };
  };
}

export default function EvaluationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [annotations, setAnnotations] = useState<any[]>([]);

  useEffect(() => {
    fetchEvaluation();
    fetchCriteria();
    fetchAnnotations();
  }, [id]);

  const fetchEvaluation = async () => {
    try {
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
        .eq("id", id)
        .single();

      if (error) throw error;

      // Get athlete profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.athletes.user_id)
        .single();

      const evalWithProfile = {
        ...data,
        scores: (data.scores || {}) as Record<string, number>,
        athletes: {
          ...data.athletes,
          profiles: profileData || { full_name: "Unknown" }
        }
      };

      setEvaluation(evalWithProfile);
      setScores((data.scores || {}) as Record<string, number>);
      setFeedback(data.feedback || "");
    } catch (error: any) {
      console.error("Error fetching evaluation:", error);
      toast({
        title: "Error",
        description: "Failed to load evaluation",
        variant: "destructive",
      });
      navigate("/coach/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchCriteria = async () => {
    try {
      const { data, error } = await supabase
        .from("evaluation_criteria")
        .select("*")
        .order("order_index");

      if (error) throw error;
      setCriteria(data || []);
    } catch (error) {
      console.error("Error fetching criteria:", error);
    }
  };

  const fetchAnnotations = async () => {
    try {
      const { data, error } = await supabase
        .from("evaluation_annotations")
        .select("*")
        .eq("evaluation_id", id)
        .order("timestamp_ms");

      if (error) throw error;
      setAnnotations(data || []);
    } catch (error) {
      console.error("Error fetching annotations:", error);
    }
  };

  const handleSaveAnnotation = async (annotation: any) => {
    try {
      const { error } = await supabase
        .from("evaluation_annotations")
        .insert({
          evaluation_id: id,
          ...annotation
        });

      if (error) throw error;
      await fetchAnnotations();
    } catch (error) {
      console.error("Error saving annotation:", error);
      toast({
        title: "Error",
        description: "Failed to save annotation",
        variant: "destructive",
      });
    }
  };

  const handleScoreChange = (criteriaId: string, value: number) => {
    setScores(prev => ({ ...prev, [criteriaId]: value }));
  };

  const handleSave = async (markComplete = false) => {
    setSaving(true);
    try {
      const updateData: any = {
        scores,
        feedback,
        status: markComplete ? "completed" : "in_progress",
      };

      if (markComplete) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("evaluations")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // Send notification if completing evaluation
      if (markComplete) {
        try {
          // Send notification to athlete
          const { error: notifError } = await supabase.functions.invoke(
            "notify-evaluation-complete",
            {
              body: { evaluationId: id },
            }
          );

          if (notifError) {
            console.error("Failed to send notification:", notifError);
          }

          // Trigger rankings recalculation
          supabase.functions.invoke("recalculate-rankings").catch((error) => {
            console.error("Failed to recalculate rankings:", error);
          });
        } catch (notifError) {
          console.error("Notification error:", notifError);
        }
      }

      toast({
        title: "Success!",
        description: markComplete
          ? "Evaluation completed and athlete has been notified"
          : "Progress saved successfully",
      });

      if (markComplete) {
        navigate("/coach/dashboard");
      } else {
        fetchEvaluation();
      }
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save evaluation",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading evaluation...</p>
        </div>
      </div>
    );
  }

  if (!evaluation) return null;

  const allScoresProvided = criteria.every(c => scores[c.id] !== undefined);
  const canComplete = allScoresProvided && feedback.trim().length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/coach/dashboard")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video Player and Annotations */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {evaluation.athletes.profiles.full_name}
              </CardTitle>
              <CardDescription>
                {evaluation.athletes.position} • {evaluation.athletes.sport}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <VideoAnnotation
                videoUrl={evaluation.video_url}
                evaluationId={evaluation.id}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(`/profile?id=${evaluation.athletes.user_id}`, '_blank')}
              >
                View Athlete Profile
              </Button>
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Coach Feedback</CardTitle>
              <CardDescription>
                Provide detailed feedback on the athlete's performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Share your observations, strengths, areas for improvement, and recommendations..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Scoring Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Evaluation Scores
              </CardTitle>
              <CardDescription>
                Rate each criterion from 0-10
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {criteria.map((criterion) => (
                <div key={criterion.id} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <Label className="font-medium">{criterion.name}</Label>
                      <p className="text-xs text-muted-foreground">
                        {criterion.description}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {scores[criterion.id] ?? 0}/{criterion.max_score}
                    </span>
                  </div>
                  <Slider
                    value={[scores[criterion.id] ?? 0]}
                    onValueChange={([value]) => handleScoreChange(criterion.id, value)}
                    max={criterion.max_score}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => handleSave(false)}
              disabled={saving}
              variant="outline"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Progress
            </Button>
            <Button
              className="w-full"
              onClick={() => handleSave(true)}
              disabled={saving || !canComplete}
            >
              Complete Evaluation
            </Button>
            {!canComplete && (
              <p className="text-xs text-muted-foreground text-center">
                Provide all scores and feedback to complete
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
