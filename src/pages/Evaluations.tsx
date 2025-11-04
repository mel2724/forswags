import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Clock, CheckCircle, AlertCircle, ArrowLeft, Video, DollarSign, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Evaluation {
  id: string;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "refunded";
  rating: number | null;
  feedback: string | null;
  purchased_at: string;
  completed_at: string | null;
  coach_id: string | null;
  video_url: string | null;
  scores: Record<string, number>;
  is_reevaluation: boolean;
}

export default function Evaluations() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const loadData = async () => {
      const success = searchParams.get("success");
      const canceled = searchParams.get("canceled");

      // If coming from successful payment, wait a moment for backend to process
      if (success === "true") {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      await fetchEvaluations();

      if (success === "true") {
        toast({
          title: "Payment Successful!",
          description: "Your evaluation will be assigned to a coach shortly.",
        });
      } else if (canceled === "true") {
        toast({
          title: "Payment Canceled",
          description: "You can purchase an evaluation anytime.",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [searchParams]);

  const fetchEvaluations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: athleteData } = await supabase
        .from("athletes")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!athleteData) return;

      const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .eq("athlete_id", athleteData.id)
        .order("purchased_at", { ascending: false });

      if (error) throw error;
      
      // Type assertion for scores field
      const typedData = (data || []).map(item => ({
        ...item,
        scores: (item.scores || {}) as Record<string, number>
      }));
      
      setEvaluations(typedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load evaluations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: "Pending", icon: Clock, variant: "secondary" as const },
      in_progress: { label: "In Progress", icon: AlertCircle, variant: "default" as const },
      completed: { label: "Completed", icon: CheckCircle, variant: "default" as const },
    };
    const config = variants[status as keyof typeof variants];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? "fill-primary text-primary" : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  const filterByStatus = (status?: string) => {
    if (!status) return evaluations;
    return evaluations.filter((e) => e.status === status);
  };

  const EvaluationCard = ({ evaluation }: { evaluation: Evaluation }) => {
    const canReevaluate = evaluation.status === "completed" && evaluation.completed_at;
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const completedDate = evaluation.completed_at ? new Date(evaluation.completed_at) : null;
    const isEligibleForReevaluation = completedDate && completedDate <= twoMonthsAgo;

    const handleReevaluationRequest = () => {
      navigate(`/evaluations/purchase?reevaluation=${evaluation.id}`);
    };

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                Coach Evaluation {evaluation.is_reevaluation && <Badge variant="secondary" className="ml-2">Re-evaluation</Badge>}
              </CardTitle>
              <CardDescription>
                Purchased {new Date(evaluation.purchased_at).toLocaleDateString()}
              </CardDescription>
            </div>
            {getStatusBadge(evaluation.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {evaluation.status === "completed" && evaluation.rating && (
            <div>
              <p className="text-sm font-medium mb-2">Rating</p>
              {renderStars(evaluation.rating)}
            </div>
          )}
          {evaluation.feedback && (
            <div>
              <p className="text-sm font-medium mb-2">Coach Feedback</p>
              <p className="text-sm text-muted-foreground">{evaluation.feedback}</p>
            </div>
          )}
          {evaluation.completed_at && (
            <p className="text-xs text-muted-foreground">
              Completed {new Date(evaluation.completed_at).toLocaleDateString()}
            </p>
          )}
      {canReevaluate && isEligibleForReevaluation && (
        <div className="space-y-2">
          <Button 
            onClick={handleReevaluationRequest}
            variant="outline"
            className="w-full"
          >
            Request Re-evaluation
          </Button>
        </div>
      )}
          {canReevaluate && !isEligibleForReevaluation && (
            <p className="text-xs text-muted-foreground text-center">
              Re-evaluation available {completedDate && new Date(completedDate.getTime() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    );
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
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Coach Evaluations</h1>
            <p className="text-muted-foreground">
              Get professional feedback from certified coaches
            </p>
          </div>
          {evaluations.length > 1 && (
            <Button onClick={() => navigate("/evaluations/progress")} variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Progress
            </Button>
          )}
        </div>

        <Card className="border-primary mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-6 w-6 text-primary" />
              Get Professional Evaluation
            </CardTitle>
            <CardDescription>
              Purchase a video evaluation from certified coaches. First evaluation $97, re-evaluations $49 (within 1 year).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold">What You'll Get:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Professional video analysis</li>
                  <li>✓ Detailed written feedback</li>
                  <li>✓ Performance ratings</li>
                  <li>✓ Expert recommendations</li>
                </ul>
              </div>
              <Button 
                onClick={() => navigate("/evaluations/purchase")} 
                size="lg"
                className="whitespace-nowrap"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Purchase Evaluation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All ({evaluations.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({filterByStatus("pending").length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({filterByStatus("in_progress").length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({filterByStatus("completed").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {evaluations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No evaluations yet</p>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Purchase a coach evaluation to get professional feedback on your performance
                </p>
              </CardContent>
            </Card>
          ) : (
            evaluations.map((evaluation) => (
              <EvaluationCard key={evaluation.id} evaluation={evaluation} />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {filterByStatus("pending").map((evaluation) => (
            <EvaluationCard key={evaluation.id} evaluation={evaluation} />
          ))}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4 mt-6">
          {filterByStatus("in_progress").map((evaluation) => (
            <EvaluationCard key={evaluation.id} evaluation={evaluation} />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {filterByStatus("completed").map((evaluation) => (
            <EvaluationCard key={evaluation.id} evaluation={evaluation} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
