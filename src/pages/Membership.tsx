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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");
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

  const handleSubscribe = async (priceId: string, productName: string, priceAmount: number, interval: string) => {
    setLoading(true);
    try {
      if (paymentMethod === "stripe") {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: { priceId, promoCode: validPromoCode },
        });

        if (error) throw error;

        if (data?.url) {
          window.open(data.url, "_blank");
        }
      } else {
        // PayPal checkout - note: requires PayPal plan IDs to be configured
        toast({
          title: "PayPal Integration",
          description: "PayPal subscription plans need to be set up in your PayPal Business account first.",
        });
        
        // Uncomment when PayPal plans are configured:
        // const { data, error } = await supabase.functions.invoke("create-paypal-checkout", {
        //   body: { 
        //     plan: "YOUR_PAYPAL_PLAN_ID", // Replace with actual PayPal plan ID
        //     price: priceAmount,
        //     interval: interval
        //   },
        // });
        // if (error) throw error;
        // if (data?.url) {
        //   window.open(data.url, "_blank");
        // }
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

            {/* Payment Method Selection */}
            {!subscriptionStatus?.subscribed && (
              <div className="mb-8 max-w-md mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Select Payment Method</CardTitle>
                    <CardDescription>Choose how you'd like to pay</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:border-primary cursor-pointer">
                        <RadioGroupItem value="stripe" id="stripe" />
                        <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer flex-1">
                          <CreditCard className="h-5 w-5" />
                          <div>
                            <div className="font-semibold">Credit Card (Stripe)</div>
                            <div className="text-sm text-muted-foreground">Visa, Mastercard, Amex</div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:border-primary cursor-pointer">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer flex-1">
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.773.773 0 0 1 .762-.64h8.236c2.747 0 4.971 2.223 4.971 4.97 0 2.746-2.224 4.97-4.971 4.97h-4.61l-1.255 7.676a.641.641 0 0 1-.632.641h-.369zm12.738-7.676h-4.61l-1.255 7.676a.641.641 0 0 1-.633.641h-.369l.001-.001H8.34a.641.641 0 0 1-.633-.74l3.107-16.877a.773.773 0 0 1 .762-.64h8.236c2.747 0 4.971 2.223 4.971 4.97 0 2.746-2.224 4.97-4.971 4.97h.002z"/>
                          </svg>
                          <div>
                            <div className="font-semibold">PayPal</div>
                            <div className="text-sm text-muted-foreground">Fast & secure</div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
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
                    onClick={() => handleSubscribe(
                      STRIPE_PRODUCTS.membership.athlete.monthly.price_id,
                      STRIPE_PRODUCTS.membership.athlete.monthly.name,
                      STRIPE_PRODUCTS.membership.athlete.monthly.price,
                      "month"
                    )}
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
                    onClick={() => handleSubscribe(
                      STRIPE_PRODUCTS.membership.athlete.yearly.price_id,
                      STRIPE_PRODUCTS.membership.athlete.yearly.name,
                      STRIPE_PRODUCTS.membership.athlete.yearly.price,
                      "year"
                    )}
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
