import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { DollarSign, RefreshCw } from "lucide-react";

interface Refund {
  id: string;
  stripe_refund_id: string;
  stripe_payment_intent_id: string;
  user_id: string;
  amount: number;
  reason: string | null;
  status: string;
  created_at: string;
}

export default function AdminRefunds() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("refunds")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRefunds(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch refunds");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const processRefund = async () => {
    if (!paymentIntentId || !userId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-refund", {
        body: {
          payment_intent_id: paymentIntentId,
          user_id: userId,
          amount: amount ? parseFloat(amount) : undefined,
          reason: reason || undefined,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Refund processed: $${data.amount}`);
        setDialogOpen(false);
        resetForm();
        fetchRefunds();
      } else {
        throw new Error(data?.error || "Failed to process refund");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process refund");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPaymentIntentId("");
    setUserId("");
    setAmount("");
    setReason("");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      succeeded: "default",
      pending: "secondary",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Refund Management</h1>
          <p className="text-muted-foreground">Process and track customer refunds</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <DollarSign className="h-4 w-4 mr-2" />
              Process Refund
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process New Refund</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentIntentId">Stripe Payment Intent ID *</Label>
                <Input
                  id="paymentIntentId"
                  placeholder="pi_xxxxxxxxxxxxx"
                  value={paymentIntentId}
                  onChange={(e) => setPaymentIntentId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Find this in Stripe Dashboard under the payment
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userId">User ID *</Label>
                <Input
                  id="userId"
                  placeholder="User UUID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Refund Amount (optional)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Leave empty for full refund"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter amount in dollars (e.g., 14.99)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Reason for refund..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <Button onClick={processRefund} disabled={loading} className="w-full">
                {loading ? "Processing..." : "Process Refund"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Refund History</CardTitle>
              <CardDescription>View all processed refunds</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRefunds}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No refunds processed yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Refund ID</TableHead>
                  <TableHead>Payment Intent</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map((refund) => (
                  <TableRow key={refund.id}>
                    <TableCell>
                      {new Date(refund.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {refund.stripe_refund_id}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {refund.stripe_payment_intent_id}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${refund.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {refund.reason || "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(refund.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
