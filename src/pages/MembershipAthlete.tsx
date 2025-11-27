import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, ArrowLeft } from "lucide-react";
import { STRIPE_PRODUCTS, getStripeProducts, formatPrice, getMembershipTier } from "@/lib/stripeConfig";

const PRODUCTS = getStripeProducts();

interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

export default function MembershipAthlete() {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const initSubscription = async () => {
      // Check if user is authenticated first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCheckingStatus(false);
        toast({
          title: "Authentication required",
          description: "Please log in to view subscription status.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      checkSubscription();

      const status = searchParams.get("subscription");
      if (status === "success") {
        toast({
          title: "Success!",
          description: "Your subscription has been activated.",
        });
        setTimeout(() => checkSubscription(), 2000);
      } else if (status === "canceled") {
        toast({
          title: "Canceled",
          description: "Subscription purchase was canceled.",
          variant: "destructive",
        });
      }
    };

    initSubscription();
  }, [searchParams]);

  const checkSubscription = async () => {
    setCheckingStatus(true);
    try {
      // Refresh session to ensure valid token
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !session) {
        throw new Error("No valid session after refresh");
      }

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) throw error;
      setSubscriptionStatus(data);
    } catch (error: any) {
      console.error("Error checking subscription:", error);
      if (error.message?.includes("Authentication") || error.message?.includes("session")) {
        toast({
          title: "Session expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        navigate("/auth");
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    setLoading(true);
    try {
      // Refresh session to ensure valid token
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError || !session) {
        toast({
          title: "Session expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { 
          priceId,
          returnPath: "/membership/athlete"
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      
      // Enhanced error handling
      const errorType = error.error_type || (error.message?.includes("config") ? "config_error" : "unknown_error");
      
      let errorMessage = "Failed to start checkout process. Please try again.";
      if (errorType === "config_error") {
        errorMessage = "Payment system is being configured. Please try again later or contact support.";
      } else if (errorType === "auth_error") {
        errorMessage = "Please log in again to continue with your subscription.";
        setTimeout(() => navigate("/auth"), 2000);
      } else if (errorType === "network_error") {
        errorMessage = "Unable to connect to payment server. Please check your connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      const errorMessage = error.message?.includes("configuration") || error.error?.includes("configuration")
        ? "Subscription management is being set up. Please contact support."
        : "Failed to open customer portal. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentTier = getMembershipTier(subscriptionStatus?.product_id || null);
  const isAthlete = currentTier?.role === "athlete";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Athlete Membership Plans</h1>
          <p className="text-muted-foreground text-lg">
            Unlock premium features and maximize your recruiting potential
          </p>
        </div>

        {checkingStatus ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading subscription status...</p>
          </div>
        ) : (
          <>
            {subscriptionStatus?.subscribed && isAthlete && (
              <div className="mb-8 text-center">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Current Plan: {currentTier?.tier === "monthly" ? "Pro Monthly" : "Championship Yearly"}
                </Badge>
                {subscriptionStatus.subscription_end && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Renews on {new Date(subscriptionStatus.subscription_end).toLocaleDateString()}
                  </p>
                )}
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="mt-4"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Monthly Plan */}
              <Card className={currentTier?.tier === "monthly" ? "border-primary" : ""}>
                <CardHeader>
                  {currentTier?.tier === "monthly" && (
                    <Badge className="w-fit mb-2">Current Plan</Badge>
                  )}
                  <CardTitle className="text-2xl">{PRODUCTS.membership.athlete.monthly.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {formatPrice(PRODUCTS.membership.athlete.monthly.price)}
                    <span className="text-base font-normal text-muted-foreground">/month</span>
                  </div>
                  <CardDescription>Billed monthly</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Unlimited course access</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Priority support</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>"Prime Dime" matching tools</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Advanced analytics</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Free parent account</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(PRODUCTS.membership.athlete.monthly.price_id)}
                    disabled={loading || currentTier?.tier === "monthly"}
                  >
                    {currentTier?.tier === "monthly" ? "Current Plan" : "Subscribe Monthly"}
                  </Button>
                </CardContent>
              </Card>

              {/* Yearly Plan */}
              <Card className={currentTier?.tier === "yearly" ? "border-primary" : ""}>
                <CardHeader>
                  {currentTier?.tier === "yearly" && (
                    <Badge className="w-fit mb-2">Current Plan</Badge>
                  )}
                  <Badge variant="secondary" className="w-fit mb-2">Save 46%</Badge>
                  <CardTitle className="text-2xl">{PRODUCTS.membership.athlete.yearly.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {formatPrice(PRODUCTS.membership.athlete.yearly.price)}
                    <span className="text-base font-normal text-muted-foreground">/year</span>
                  </div>
                  <CardDescription>
                    {formatPrice(PRODUCTS.membership.athlete.yearly.price / 12)}/month when paid annually
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Everything in Monthly</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>2 months free</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Free parent account</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(PRODUCTS.membership.athlete.yearly.price_id)}
                    disabled={loading || currentTier?.tier === "yearly"}
                  >
                    {currentTier?.tier === "yearly" ? "Current Plan" : "Subscribe Yearly"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}