import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminEvaluationPayments() {
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionId.trim()) {
      toast({
        title: "Session ID Required",
        description: "Please enter a Stripe session ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-evaluation-payment', {
        body: { session_id: sessionId.trim() }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Payment Verified",
          description: `Evaluation ${data.evaluation_id} has been created successfully`,
        });
        setSessionId("");
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Payment not completed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Manual Payment Verification</h1>
        <p className="text-muted-foreground">
          Manually verify Stripe payment sessions for evaluations that failed to complete
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Verify Stripe Session
          </CardTitle>
          <CardDescription>
            Enter a Stripe checkout session ID to manually verify the payment and create the evaluation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyPayment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sessionId">Stripe Session ID</Label>
              <Input
                id="sessionId"
                placeholder="cs_test_..."
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                The session ID must start with <span className="font-mono font-semibold">cs_</span> (not pm_ or pi_) and can be found in the Stripe dashboard under Payments → Checkout Sessions
              </p>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify Payment
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-orange-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-500">
            <AlertCircle className="h-5 w-5" />
            How to Find Session IDs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">To find a Stripe session ID:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
            <li>Ask the user for the approximate time they made the purchase</li>
            <li>Check your Stripe dashboard under Payments → Checkout Sessions</li>
            <li>Find the session for that timeframe</li>
            <li>Copy the session ID (starts with cs_)</li>
            <li>Paste it in the field above and verify</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
