import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminPayPalSetup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    product_id?: string;
    monthly_plan_id?: string;
    yearly_plan_id?: string;
    message?: string;
    error?: string;
  } | null>(null);

  const createPayPalPlans = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-paypal-plans');

      if (error) throw error;

      setResult(data);
      if (data.success) {
        toast.success("PayPal plans created successfully!");
      }
    } catch (error) {
      console.error("Error creating PayPal plans:", error);
      setResult({ error: error instanceof Error ? error.message : "Unknown error" });
      toast.error("Failed to create PayPal plans");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>PayPal Subscription Setup</CardTitle>
          <CardDescription>
            Create PayPal subscription plans programmatically. Click the button below to create
            both monthly and yearly subscription plans.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={createPayPalPlans} 
            disabled={loading}
            size="lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Creating Plans..." : "Create PayPal Plans"}
          </Button>

          {result && result.success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="space-y-4">
                <div className="font-semibold text-green-900">
                  {result.message}
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-green-900">Product ID:</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white p-2 rounded border text-sm">
                        {result.product_id}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(result.product_id || "")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium text-green-900">Monthly Plan ID:</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white p-2 rounded border text-sm">
                        {result.monthly_plan_id}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(result.monthly_plan_id || "")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium text-green-900">Yearly Plan ID:</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white p-2 rounded border text-sm">
                        {result.yearly_plan_id}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(result.yearly_plan_id || "")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-green-800 mt-4">
                  Next steps:
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Copy these Plan IDs</li>
                    <li>Update your code with these IDs</li>
                    <li>Configure PayPal webhook to handle subscription events</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {result && result.error && (
            <Alert variant="destructive">
              <AlertDescription>
                <div className="font-semibold">Error creating PayPal plans:</div>
                <div className="mt-1 text-sm">{result.error}</div>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Note:</strong> This will create the following in your PayPal account:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>One product: "ForSWAGs Membership"</li>
              <li>Two billing plans:</li>
              <ul className="list-circle list-inside ml-4">
                <li>"Pro Monthly" - $97.00/month</li>
                <li>"Championship Yearly" - $497.00/year</li>
              </ul>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
