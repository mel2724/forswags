import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Evaluation {
  id: string;
  status: "pending" | "in_progress" | "completed";
  rating: number | null;
  feedback: string | null;
  purchased_at: string;
  completed_at: string | null;
  coach_id: string | null;
}

export default function Evaluations() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvaluations();
  }, []);

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
      setEvaluations(data || []);
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

  const EvaluationCard = ({ evaluation }: { evaluation: Evaluation }) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Coach Evaluation</CardTitle>
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
      </CardContent>
    </Card>
  );

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
        <h1 className="text-3xl font-bold mb-2">Coach Evaluations</h1>
        <p className="text-muted-foreground">
          Professional evaluations from expert coaches to help you improve
        </p>
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
