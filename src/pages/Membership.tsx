import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, ArrowLeft } from "lucide-react";
import { STRIPE_PRODUCTS, formatPrice, getMembershipTier } from "@/lib/stripeConfig";

interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

export default function Membership() {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    checkSubscription();

    const status = searchParams.get("subscription");
    if (status === "success") {
      toast({
        title: "Success!",
        description: "Your subscription has been activated.",
      });
      // Refresh subscription status
      setTimeout(() => checkSubscription(), 2000);
    } else if (status === "canceled") {
      toast({
        title: "Canceled",
        description: "Subscription purchase was canceled.",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  const checkSubscription = async () => {
    setCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscriptionStatus(data);
    } catch (error: any) {
      console.error("Error checking subscription:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
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
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast({
        title: "Error",
        description: "Failed to open customer portal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentTier = getMembershipTier(subscriptionStatus?.product_id || null);

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
          <h1 className="text-4xl font-bold mb-4">Choose Your Membership</h1>
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
            {subscriptionStatus?.subscribed && (
              <div className="mb-8 text-center">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Current Plan: {currentTier === "monthly" ? "Monthly Elite" : "Yearly Elite"}
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
              <Card className={currentTier === "monthly" ? "border-primary" : ""}>
                <CardHeader>
                  {currentTier === "monthly" && (
                    <Badge className="w-fit mb-2">Current Plan</Badge>
                  )}
                  <CardTitle className="text-2xl">{STRIPE_PRODUCTS.membership.monthly.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {formatPrice(STRIPE_PRODUCTS.membership.monthly.price)}
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
                      <span>College matching tools</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Advanced analytics</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(STRIPE_PRODUCTS.membership.monthly.price_id)}
                    disabled={loading || currentTier === "monthly"}
                  >
                    {currentTier === "monthly" ? "Current Plan" : "Subscribe Monthly"}
                  </Button>
                </CardContent>
              </Card>

              {/* Yearly Plan */}
              <Card className={currentTier === "yearly" ? "border-primary" : ""}>
                <CardHeader>
                  {currentTier === "yearly" && (
                    <Badge className="w-fit mb-2">Current Plan</Badge>
                  )}
                  <Badge variant="secondary" className="w-fit mb-2">Save 46%</Badge>
                  <CardTitle className="text-2xl">{STRIPE_PRODUCTS.membership.yearly.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {formatPrice(STRIPE_PRODUCTS.membership.yearly.price)}
                    <span className="text-base font-normal text-muted-foreground">/year</span>
                  </div>
                  <CardDescription>
                    {formatPrice(STRIPE_PRODUCTS.membership.yearly.price / 12)}/month when paid annually
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
                      <span>Exclusive yearly webinars</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Priority feature access</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(STRIPE_PRODUCTS.membership.yearly.price_id)}
                    disabled={loading || currentTier === "yearly"}
                  >
                    {currentTier === "yearly" ? "Current Plan" : "Subscribe Yearly"}
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
