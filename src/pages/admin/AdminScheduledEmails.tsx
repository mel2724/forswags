import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Loader2, Calendar, X, CheckCircle, XCircle, Clock, AlertCircle, Activity } from "lucide-react";
import { format } from "date-fns";

interface ScheduledEmail {
  id: string;
  subject: string;
  message: string;
  scheduled_for: string;
  status: string;
  include_inactive: boolean;
  recipient_count: number | null;
  success_count: number | null;
  failed_count: number | null;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  created_by: string;
  open_count: number | null;
  click_count: number | null;
  unique_opens: number | null;
  unique_clicks: number | null;
}

const AdminScheduledEmails = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<ScheduledEmail[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<ScheduledEmail[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<ScheduledEmail | null>(null);
  const [emailToCancel, setEmailToCancel] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchScheduledEmails();
  }, []);

  useEffect(() => {
    filterEmails();
  }, [searchQuery, emails, activeTab]);

  const fetchScheduledEmails = async () => {
    try {
      const { data, error } = await supabase
        .from("scheduled_emails")
        .select("*")
        .order("scheduled_for", { ascending: false });

      if (error) throw error;
      setEmails(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterEmails = () => {
    let filtered = emails;

    // Filter by status tab
    if (activeTab !== "all") {
      filtered = filtered.filter((email) => email.status === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (email) =>
          email.subject.toLowerCase().includes(query) ||
          email.message.toLowerCase().includes(query)
      );
    }

    setFilteredEmails(filtered);
  };

  const handleCancelEmail = async () => {
    if (!emailToCancel) return;
    setCancelling(true);

    try {
      const { error } = await supabase
        .from("scheduled_emails")
        .update({ status: "cancelled" })
        .eq("id", emailToCancel);

      if (error) throw error;

      toast({
        title: "Email Cancelled",
        description: "The scheduled email has been cancelled.",
      });

      fetchScheduledEmails();
      setEmailToCancel(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline">
            <X className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusCounts = () => {
    return {
      all: emails.length,
      pending: emails.filter((e) => e.status === "pending").length,
      sent: emails.filter((e) => e.status === "sent").length,
      cancelled: emails.filter((e) => e.status === "cancelled").length,
      failed: emails.filter((e) => e.status === "failed").length,
    };
  };

  const isPastScheduledTime = (scheduledFor: string) => {
    return new Date(scheduledFor) <= new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scheduled Emails</h1>
        <p className="text-muted-foreground">
          View and manage scheduled email announcements
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.all}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.cancelled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.failed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle>Scheduled Emails</CardTitle>
            <Input
              placeholder="Search by subject or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
              <TabsTrigger value="sent">Sent ({statusCounts.sent})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({statusCounts.cancelled})</TabsTrigger>
              <TabsTrigger value="failed">Failed ({statusCounts.failed})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Success/Failed</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No scheduled emails found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmails.map((email) => (
                      <TableRow key={email.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {email.subject}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm">
                              <div>{format(new Date(email.scheduled_for), "PPP")}</div>
                              <div className="text-muted-foreground">
                                {format(new Date(email.scheduled_for), "p")}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(email.status)}</TableCell>
                        <TableCell>
                          {email.recipient_count ? (
                            <span className="font-medium">{email.recipient_count}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {email.success_count !== null ? (
                            <div className="text-sm">
                              <span className="text-green-600 font-medium">
                                {email.success_count}
                              </span>
                              {" / "}
                              <span className="text-red-600 font-medium">
                                {email.failed_count || 0}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(email.created_at), "PP")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedEmail(email)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {email.status === "pending" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setEmailToCancel(email.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scheduled Email Details</DialogTitle>
            <DialogDescription>
              View complete information about this scheduled email
            </DialogDescription>
          </DialogHeader>

          {selectedEmail && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold mb-1">Status</h4>
                  {getStatusBadge(selectedEmail.status)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Scheduled For</h4>
                  <p className="text-sm">
                    {format(new Date(selectedEmail.scheduled_for), "PPpp")}
                  </p>
                </div>
              </div>

              {selectedEmail.sent_at && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Sent At</h4>
                  <p className="text-sm">{format(new Date(selectedEmail.sent_at), "PPpp")}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-1">Subject</h4>
                <p className="text-sm">{selectedEmail.subject}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-1">Message</h4>
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{selectedEmail.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold mb-1">Include Inactive</h4>
                  <Badge variant={selectedEmail.include_inactive ? "default" : "secondary"}>
                    {selectedEmail.include_inactive ? "Yes" : "No"}
                  </Badge>
                </div>
                {selectedEmail.recipient_count && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Recipients</h4>
                    <p className="text-sm font-medium">{selectedEmail.recipient_count}</p>
                  </div>
                )}
              </div>

              {selectedEmail.status === "sent" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-1 text-green-600">
                        Successful Sends
                      </h4>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedEmail.success_count || 0}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1 text-red-600">Failed Sends</h4>
                      <p className="text-2xl font-bold text-red-600">
                        {selectedEmail.failed_count || 0}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-3">Engagement Analytics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="h-4 w-4 text-blue-600" />
                          <h5 className="text-sm font-medium text-blue-900">Opens</h5>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <p className="text-2xl font-bold text-blue-600">
                            {selectedEmail.open_count || 0}
                          </p>
                          <p className="text-sm text-blue-700">
                            ({selectedEmail.unique_opens || 0} unique)
                          </p>
                        </div>
                        {selectedEmail.recipient_count && selectedEmail.recipient_count > 0 && (
                          <p className="text-xs text-blue-600 mt-1">
                            {((((selectedEmail.unique_opens || 0) / selectedEmail.recipient_count) * 100).toFixed(1))}% open rate
                          </p>
                        )}
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="h-4 w-4 text-purple-600" />
                          <h5 className="text-sm font-medium text-purple-900">Clicks</h5>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <p className="text-2xl font-bold text-purple-600">
                            {selectedEmail.click_count || 0}
                          </p>
                          <p className="text-sm text-purple-700">
                            ({selectedEmail.unique_clicks || 0} unique)
                          </p>
                        </div>
                        {selectedEmail.recipient_count && selectedEmail.recipient_count > 0 && (
                          <p className="text-xs text-purple-600 mt-1">
                            {((((selectedEmail.unique_clicks || 0) / selectedEmail.recipient_count) * 100).toFixed(1))}% click rate
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Delivery Rate</p>
                        <p className="text-lg font-bold">
                          {selectedEmail.recipient_count && selectedEmail.recipient_count > 0
                            ? ((((selectedEmail.success_count || 0) / selectedEmail.recipient_count) * 100).toFixed(1))
                            : '0'}%
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Engagement Rate</p>
                        <p className="text-lg font-bold">
                          {selectedEmail.recipient_count && selectedEmail.recipient_count > 0
                            ? ((((selectedEmail.unique_opens || 0) + (selectedEmail.unique_clicks || 0)) / selectedEmail.recipient_count) * 100).toFixed(1)
                            : '0'}%
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Click-to-Open</p>
                        <p className="text-lg font-bold">
                          {selectedEmail.unique_opens && selectedEmail.unique_opens > 0
                            ? ((((selectedEmail.unique_clicks || 0) / selectedEmail.unique_opens) * 100).toFixed(1))
                            : '0'}%
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedEmail.error_message && (
                <div>
                  <h4 className="text-sm font-semibold mb-1 flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    Error Message
                  </h4>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                    <p className="text-sm text-red-800">{selectedEmail.error_message}</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Created: {format(new Date(selectedEmail.created_at), "PPpp")}
                </p>
                <p className="text-xs text-muted-foreground">Email ID: {selectedEmail.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!emailToCancel} onOpenChange={() => setEmailToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Scheduled Email?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will cancel the scheduled email. It will not be sent at the scheduled
              time. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelEmail}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Email"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminScheduledEmails;
