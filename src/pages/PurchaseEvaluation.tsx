import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Video, CheckCircle, DollarSign, ArrowLeft } from "lucide-react";

export default function PurchaseEvaluation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    checkAuth();
    
    // Check if returning from successful payment
    const success = searchParams.get("success");
    const sessionId = searchParams.get("session_id");
    
    if (success === "true" && sessionId) {
      verifyPayment(sessionId);
    }
  }, [searchParams]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const verifyPayment = async (sessionId: string) => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-evaluation-payment', {
        body: { session_id: sessionId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Evaluation Purchased!",
          description: "Your evaluation request has been submitted to our coaches.",
        });
        navigate("/evaluations");
      }
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify payment",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoUrl.trim()) {
      toast({
        title: "Video Required",
        description: "Please provide a link to your highlight video",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-evaluation-payment', {
        body: {
          video_url: videoUrl,
        }
      });

      if (error) throw error;

      if (data.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Payment",
          description: "Complete your purchase in the new tab",
        });
      }
    } catch (error: any) {
      console.error("Error creating payment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-lg">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/evaluations")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Evaluations
        </Button>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Purchase Form */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Video Evaluation</CardTitle>
              <CardDescription>
                Get expert feedback from certified coaches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePurchase} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="video_url">Highlight Video URL *</Label>
                  <Input
                    id="video_url"
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide a link to your highlight video (YouTube, Vimeo, Hudl, etc.)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any specific areas you'd like the coach to focus on..."
                    rows={4}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full" size="lg">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Purchase for $49.99
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* What's Included */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What You'll Get</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Professional Video Analysis</p>
                    <p className="text-sm text-muted-foreground">
                      Frame-by-frame breakdown of your technique
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Detailed Written Feedback</p>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive notes on strengths and areas to improve
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Performance Rating</p>
                    <p className="text-sm text-muted-foreground">
                      Objective scoring across key skill categories
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Certified Coach</p>
                    <p className="text-sm text-muted-foreground">
                      Review by an experienced, vetted coaching professional
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <p>Submit your video URL and complete payment</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <p>A certified coach will review your video</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <p>Receive detailed feedback within 3-5 business days</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
