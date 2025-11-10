import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, ArrowLeft, Target, Star } from "lucide-react";
import { STRIPE_PRODUCTS, formatPrice, getMembershipTier } from "@/lib/stripeConfig";

interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

export default function MembershipRecruiter() {
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
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
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { 
          priceId,
          returnPath: "/membership/recruiter"
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout process",
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
  const isRecruiter = currentTier?.role === "recruiter";

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
          <h1 className="text-4xl font-bold mb-4">College Scout Membership Plans</h1>
          <p className="text-muted-foreground text-lg">
            Get access to our complete athlete database and scouting tools
          </p>
        </div>

        {checkingStatus ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading subscription status...</p>
          </div>
        ) : (
          <>
              {subscriptionStatus?.subscribed && isRecruiter && (
              <div className="mb-8 text-center">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Current Plan: College Scout Yearly
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

            <div className="max-w-md mx-auto">
              {/* Yearly Plan */}
              <Card className={currentTier?.tier === "yearly" ? "border-secondary" : "border-secondary/30"}>
                <CardHeader>
                  {currentTier?.tier === "yearly" ? (
                    <Badge className="w-fit mb-2">Current Plan</Badge>
                  ) : (
                    <Badge variant="secondary" className="w-fit mb-2">💎 Best Value - Save 14%</Badge>
                  )}
                  <div className="flex justify-center mb-4">
                    <Star className="h-12 w-12 text-secondary" />
                  </div>
                  <CardTitle className="text-2xl text-center">{STRIPE_PRODUCTS.membership.recruiter.yearly.name}</CardTitle>
                  <div className="text-3xl font-bold text-center">
                    {formatPrice(STRIPE_PRODUCTS.membership.recruiter.yearly.price)}
                    <span className="text-base font-normal text-muted-foreground">/year</span>
                  </div>
                  <CardDescription className="text-center">
                    {formatPrice(STRIPE_PRODUCTS.membership.recruiter.yearly.price / 12)}/month when paid annually
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-secondary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Full athlete database access</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-secondary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Advanced search & filters</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-secondary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Direct messaging to athletes</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-secondary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Priority customer support</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-secondary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Analytics & insights</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => handleSubscribe(STRIPE_PRODUCTS.membership.recruiter.yearly.price_id)}
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