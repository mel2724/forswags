import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, RefreshCw, CreditCard, FileText, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MembershipDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  userName: string | null;
}

interface StripeDetails {
  customer: {
    id: string;
    email: string;
    created: number;
  } | null;
  subscriptions: Array<{
    id: string;
    status: string;
    current_period_end: number;
    current_period_start: number;
    cancel_at_period_end: boolean;
    items: Array<{
      price_id: string;
      product_id: string;
      amount: number;
      interval: string;
    }>;
  }>;
  payment_methods: Array<{
    id: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  }>;
  invoices: Array<{
    id: string;
    status: string;
    amount: number;
    created: number;
    invoice_pdf: string;
  }>;
  has_stripe_customer?: boolean;
}

export function MembershipDetailsDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
  userName,
}: MembershipDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<StripeDetails | null>(null);
  const { toast } = useToast();

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-membership", {
        body: { action: "get_details", userId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setDetails(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-membership", {
        body: { action: "get_customer_portal", userId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      window.open(data.url, "_blank");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open customer portal",
        variant: "destructive",
      });
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm("Are you sure you want to cancel this subscription? It will remain active until the end of the billing period.")) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-membership", {
        body: { action: "cancel_subscription", userId, subscriptionId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Success",
        description: "Subscription will be canceled at the end of the billing period",
      });

      fetchDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-membership", {
        body: { action: "sync_with_stripe", userId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Synced",
        description: "Membership data synced with Stripe",
      });

      fetchDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sync",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on open
  if (open && !details && !loading) {
    fetchDetails();
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      trialing: "secondary",
      past_due: "destructive",
      canceled: "secondary",
      incomplete: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Membership Details</DialogTitle>
          <DialogDescription>
            {userName || "User"} ({userEmail})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={fetchDetails} disabled={loading} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleSync} disabled={loading} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync with Stripe
            </Button>
            <Button onClick={handleOpenPortal} disabled={loading || !details || details.has_stripe_customer === false} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Customer Portal
            </Button>
          </div>

          {loading && !details ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : details ? (
            <>
              {/* Show message if no Stripe customer */}
              {details.has_stripe_customer === false ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center space-y-2">
                      <p className="text-muted-foreground">This user is on the free tier.</p>
                      <p className="text-sm text-muted-foreground">
                        No Stripe customer account exists for this user yet.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Customer Info */}
                  {details.customer && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Customer Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Stripe Customer ID:</span>
                          <span className="font-mono">{details.customer.id}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Email:</span>
                          <span>{details.customer.email}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Customer Since:</span>
                          <span>{new Date(details.customer.created * 1000).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Subscriptions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Active Subscriptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {details.subscriptions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No active subscriptions</p>
                      ) : (
                        <div className="space-y-4">
                          {details.subscriptions.map((sub) => (
                            <div key={sub.id} className="border rounded-lg p-4 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-mono text-xs text-muted-foreground">{sub.id}</div>
                                  <div className="mt-1">{getStatusBadge(sub.status)}</div>
                                </div>
                                {!sub.cancel_at_period_end && sub.status === "active" && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleCancelSubscription(sub.id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel
                                  </Button>
                                )}
                              </div>
                              <Separator />
                              {sub.items.map((item, idx) => (
                                <div key={idx} className="text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Amount:</span>
                                    <span className="font-semibold">${(item.amount / 100).toFixed(2)} / {item.interval}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Product ID:</span>
                                    <span className="font-mono text-xs">{item.product_id}</span>
                                  </div>
                                </div>
                              ))}
                              <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Current Period:</span>
                                  <span>
                                    {new Date(sub.current_period_start * 1000).toLocaleDateString()} -{" "}
                                    {new Date(sub.current_period_end * 1000).toLocaleDateString()}
                                  </span>
                                </div>
                                {sub.cancel_at_period_end && (
                                  <div className="text-destructive text-sm font-medium">
                                    Cancels at period end
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Payment Methods */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Methods
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {details.payment_methods.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No payment methods on file</p>
                      ) : (
                        <div className="space-y-2">
                          {details.payment_methods.map((pm) => (
                            <div key={pm.id} className="flex justify-between items-center text-sm">
                              <span className="capitalize">{pm.brand} •••• {pm.last4}</span>
                              <span className="text-muted-foreground">
                                Expires {pm.exp_month}/{pm.exp_year}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Invoices */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Recent Invoices
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {details.invoices.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No invoices</p>
                      ) : (
                        <div className="space-y-2">
                          {details.invoices.map((inv) => (
                            <div key={inv.id} className="flex justify-between items-center text-sm">
                              <div>
                                <div className="font-mono text-xs text-muted-foreground">{inv.id}</div>
                                <div>{new Date(inv.created * 1000).toLocaleDateString()}</div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="font-semibold">${(inv.amount / 100).toFixed(2)}</span>
                                {getStatusBadge(inv.status)}
                                {inv.invoice_pdf && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => window.open(inv.invoice_pdf, '_blank', 'noopener,noreferrer')}
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    <span className="text-xs">PDF</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Click Refresh to load membership details
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
