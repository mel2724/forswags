import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Clock, CheckCircle, AlertCircle, Upload, ArrowLeft, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Evaluation {
  id: string;
  status: "pending" | "in_progress" | "completed";
  rating: number | null;
  feedback: string | null;
  purchased_at: string;
  completed_at: string | null;
  coach_id: string | null;
  video_url: string | null;
  scores: Record<string, number>;
}

export default function Evaluations() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  const handleVideoUpload = async () => {
    if (!videoFile) {
      toast({ title: "Error", description: "Please select a video file", variant: "destructive" });
      return;
    }

    setUploadLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: athleteData } = await supabase
        .from("athletes")
        .select("id, sport, position")
        .eq("user_id", user.id)
        .single();

      if (!athleteData) throw new Error("Athlete profile not found");

      // Upload video to storage
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('media-assets')
        .upload(`evaluations/${fileName}`, videoFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media-assets')
        .getPublicUrl(`evaluations/${fileName}`);

      // Create evaluation record
      const { data: newEval, error: insertError } = await supabase
        .from("evaluations")
        .insert({
          athlete_id: athleteData.id,
          video_url: publicUrl,
          status: "pending"
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Notify coaches about new evaluation
      if (newEval) {
        supabase.functions.invoke(
          "notify-coaches-new-evaluation",
          {
            body: {
              evaluationId: newEval.id,
              sport: athleteData.sport || "",
              position: athleteData.position || "",
            },
          }
        ).catch((error) => {
          console.error("Coach notification error:", error);
        });
      }

      toast({
        title: "Success!",
        description: "Your video has been uploaded. Coaches will review it soon.",
      });

      setVideoFile(null);
      setShowUploadForm(false);
      fetchEvaluations();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
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
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <div>
        <h1 className="text-3xl font-bold mb-2">Coach Evaluations</h1>
        <p className="text-muted-foreground mb-6">
          Upload your highlight video for professional coach evaluation
        </p>

        <Card className="border-primary mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-6 w-6 text-primary" />
              Upload Highlight Video
            </CardTitle>
            <CardDescription>
              Submit your game highlights for detailed coach evaluation and feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showUploadForm ? (
              <Button onClick={() => setShowUploadForm(true)} size="lg">
                <Upload className="mr-2 h-4 w-4" />
                Upload Video for Evaluation
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="video">Select Video File</Label>
                  <Input
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Upload MP4, MOV, or other video formats (max 500MB)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleVideoUpload}
                    disabled={!videoFile || uploadLoading}
                  >
                    {uploadLoading ? "Uploading..." : "Submit for Evaluation"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUploadForm(false);
                      setVideoFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
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
