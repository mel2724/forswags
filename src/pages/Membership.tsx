import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, ArrowLeft } from "lucide-react";
import { STRIPE_PRODUCTS, formatPrice, getMembershipTier } from "@/lib/stripeConfig";
import { Input } from "@/components/ui/input";

interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

export default function Membership() {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoCodeLoading, setPromoCodeLoading] = useState(false);
  const [validPromoCode, setValidPromoCode] = useState<string | null>(null);
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
        body: { priceId, promoCode: validPromoCode },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout process",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;
    
    setPromoCodeLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('validate_promo_code', { 
          p_code: promoCode.trim(),
          p_product_id: STRIPE_PRODUCTS.membership.athlete.monthly.product_id
        });

      if (error) throw error;

      const result = data as { valid: boolean; error?: string; discount_type?: string; discount_value?: number };

      if (result.valid) {
        setValidPromoCode(promoCode.trim());
        const discount = result.discount_type === 'percentage' 
          ? `${result.discount_value}% off`
          : `$${result.discount_value} off`;
        toast({
          title: "Promo code applied!",
          description: `You'll receive ${discount} on your subscription.`,
        });
      } else {
        toast({
          title: "Invalid promo code",
          description: result.error || "This promo code is not valid.",
          variant: "destructive",
        });
        setValidPromoCode(null);
      }
    } catch (error: any) {
      console.error("Promo code error:", error);
      toast({
        title: "Error",
        description: "Failed to validate promo code",
        variant: "destructive",
      });
      setValidPromoCode(null);
    } finally {
      setPromoCodeLoading(false);
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
                  Current Plan: {currentTier?.role === "athlete" && currentTier?.tier === "monthly" ? "Pro Monthly" : "Championship Yearly"}
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

            {/* Promo Code Section */}
            {!subscriptionStatus?.subscribed && (
              <div className="mb-8 max-w-md mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Have a promo code?</CardTitle>
                    <CardDescription>Enter it below to get a discount</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        disabled={promoCodeLoading || !!validPromoCode}
                      />
                      {validPromoCode ? (
                        <Button variant="outline" onClick={() => { setValidPromoCode(null); setPromoCode(""); }}>
                          Remove
                        </Button>
                      ) : (
                        <Button onClick={validatePromoCode} disabled={promoCodeLoading || !promoCode.trim()}>
                          {promoCodeLoading ? "Validating..." : "Apply"}
                        </Button>
                      )}
                    </div>
                    {validPromoCode && (
                      <p className="text-sm text-green-600 mt-2">✓ Promo code applied: {validPromoCode}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Monthly Plan */}
              <Card className={currentTier?.role === "athlete" && currentTier?.tier === "monthly" ? "border-primary" : ""}>
                <CardHeader>
                  {currentTier?.role === "athlete" && currentTier?.tier === "monthly" && (
                    <Badge className="w-fit mb-2">Current Plan</Badge>
                  )}
                  <CardTitle className="text-2xl">{STRIPE_PRODUCTS.membership.athlete.monthly.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {formatPrice(STRIPE_PRODUCTS.membership.athlete.monthly.price)}
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
                    onClick={() => handleSubscribe(STRIPE_PRODUCTS.membership.athlete.monthly.price_id)}
                    disabled={loading || (currentTier?.role === "athlete" && currentTier?.tier === "monthly")}
                  >
                    {currentTier?.role === "athlete" && currentTier?.tier === "monthly" ? "Current Plan" : "Subscribe Monthly"}
                  </Button>
                </CardContent>
              </Card>

              {/* Yearly Plan */}
              <Card className={currentTier?.role === "athlete" && currentTier?.tier === "yearly" ? "border-primary" : ""}>
                <CardHeader>
                  {currentTier?.role === "athlete" && currentTier?.tier === "yearly" && (
                    <Badge className="w-fit mb-2">Current Plan</Badge>
                  )}
                  <Badge variant="secondary" className="w-fit mb-2">Save 46%</Badge>
                  <CardTitle className="text-2xl">{STRIPE_PRODUCTS.membership.athlete.yearly.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {formatPrice(STRIPE_PRODUCTS.membership.athlete.yearly.price)}
                    <span className="text-base font-normal text-muted-foreground">/year</span>
                  </div>
                  <CardDescription>
                    {formatPrice(STRIPE_PRODUCTS.membership.athlete.yearly.price / 12)}/month when paid annually
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
                    onClick={() => handleSubscribe(STRIPE_PRODUCTS.membership.athlete.yearly.price_id)}
                    disabled={loading || (currentTier?.role === "athlete" && currentTier?.tier === "yearly")}
                  >
                    {currentTier?.role === "athlete" && currentTier?.tier === "yearly" ? "Current Plan" : "Subscribe Yearly"}
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
