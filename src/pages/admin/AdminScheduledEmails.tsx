import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Eye, Loader2, Calendar, X, CheckCircle, XCircle, Clock, AlertCircle, Activity, TrendingUp, Mail, MousePointer, Plus, Send } from "lucide-react";
import { format, startOfDay, subDays } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

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
  
  // Create email form state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [recipientType, setRecipientType] = useState<string>("coaches");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sendType, setSendType] = useState<"immediate" | "scheduled">("immediate");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

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

  const handleCreateEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Subject and message are required",
        variant: "destructive",
      });
      return;
    }

    if (sendType === "scheduled" && (!scheduleDate || !scheduleTime)) {
      toast({
        title: "Validation Error",
        description: "Please select a date and time for scheduling",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let scheduledFor: string;
      
      if (sendType === "immediate") {
        scheduledFor = new Date().toISOString();
      } else {
        const dateTime = new Date(`${scheduleDate}T${scheduleTime}`);
        if (dateTime <= new Date()) {
          throw new Error("Scheduled time must be in the future");
        }
        scheduledFor = dateTime.toISOString();
      }

      const { error } = await supabase
        .from("scheduled_emails")
        .insert([{
          created_by: user.id,
          subject: subject.trim(),
          message: message.trim(),
          scheduled_for: scheduledFor,
          recipient_type: recipientType,
          include_inactive: includeInactive,
          status: "pending",
        }]);

      if (error) throw error;

      toast({
        title: "Email Scheduled",
        description: sendType === "immediate" 
          ? "Email will be sent shortly" 
          : `Email scheduled for ${format(new Date(scheduledFor), "PPpp")}`,
      });

      // Reset form
      setSubject("");
      setMessage("");
      setSendType("immediate");
      setScheduleDate("");
      setScheduleTime("");
      setIncludeInactive(false);
      setShowCreateDialog(false);
      
      fetchScheduledEmails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
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

  const getAggregateAnalytics = () => {
    const sentEmails = emails.filter((e) => e.status === "sent");
    const totalSent = sentEmails.length;
    const totalRecipients = sentEmails.reduce((sum, e) => sum + (e.recipient_count || 0), 0);
    const totalSuccess = sentEmails.reduce((sum, e) => sum + (e.success_count || 0), 0);
    const totalOpens = sentEmails.reduce((sum, e) => sum + (e.open_count || 0), 0);
    const totalUniqueOpens = sentEmails.reduce((sum, e) => sum + (e.unique_opens || 0), 0);
    const totalClicks = sentEmails.reduce((sum, e) => sum + (e.click_count || 0), 0);
    const totalUniqueClicks = sentEmails.reduce((sum, e) => sum + (e.unique_clicks || 0), 0);

    const avgOpenRate = totalRecipients > 0 ? (totalUniqueOpens / totalRecipients) * 100 : 0;
    const avgClickRate = totalRecipients > 0 ? (totalUniqueClicks / totalRecipients) * 100 : 0;
    const deliveryRate = totalRecipients > 0 ? (totalSuccess / totalRecipients) * 100 : 0;
    const engagementRate = totalRecipients > 0 ? ((totalUniqueOpens + totalUniqueClicks) / totalRecipients) * 100 : 0;

    return {
      totalSent,
      totalRecipients,
      totalSuccess,
      totalOpens,
      totalUniqueOpens,
      totalClicks,
      totalUniqueClicks,
      avgOpenRate,
      avgClickRate,
      deliveryRate,
      engagementRate,
    };
  };

  const getTrendData = () => {
    const sentEmails = emails.filter((e) => e.status === "sent" && e.sent_at);
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 29 - i));
      return {
        date,
        dateStr: format(date, "MMM dd"),
        emailsSent: 0,
        recipients: 0,
        opens: 0,
        clicks: 0,
        uniqueOpens: 0,
        uniqueClicks: 0,
      };
    });

    sentEmails.forEach((email) => {
      const emailDate = startOfDay(new Date(email.sent_at!));
      const dayData = last30Days.find(
        (day) => day.date.getTime() === emailDate.getTime()
      );

      if (dayData) {
        dayData.emailsSent += 1;
        dayData.recipients += email.recipient_count || 0;
        dayData.opens += email.open_count || 0;
        dayData.clicks += email.click_count || 0;
        dayData.uniqueOpens += email.unique_opens || 0;
        dayData.uniqueClicks += email.unique_clicks || 0;
      }
    });

    return last30Days.map((day) => ({
      date: day.dateStr,
      "Emails Sent": day.emailsSent,
      "Open Rate": day.recipients > 0 ? ((day.uniqueOpens / day.recipients) * 100).toFixed(1) : 0,
      "Click Rate": day.recipients > 0 ? ((day.uniqueClicks / day.recipients) * 100).toFixed(1) : 0,
      Recipients: day.recipients,
      Opens: day.opens,
      Clicks: day.clicks,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const statusCounts = getStatusCounts();
  const analytics = getAggregateAnalytics();
  const trendData = getTrendData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Track and analyze email campaign performance across all scheduled emails
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Create New Email
        </Button>
      </div>

      {/* Aggregate Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Total Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.totalRecipients} total recipients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              Avg Open Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics.avgOpenRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.totalUniqueOpens} unique opens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-purple-600" />
              Avg Click Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analytics.avgClickRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.totalUniqueClicks} unique clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.engagementRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.deliveryRate.toFixed(1)}% delivery rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email Volume (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="Emails Sent" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engagement Rates (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: '%', position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Open Rate" 
                  stroke="hsl(217, 91%, 60%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(217, 91%, 60%)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Click Rate" 
                  stroke="hsl(271, 91%, 65%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(271, 91%, 65%)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Email Status Overview */}
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

      {/* Create Email Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Scheduled Email</DialogTitle>
            <DialogDescription>
              Compose and schedule an email announcement to send to your selected recipients
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Recipient Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="recipient-type">Recipient Type</Label>
              <Select value={recipientType} onValueChange={setRecipientType}>
                <SelectTrigger id="recipient-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coaches">Coaches</SelectItem>
                  <SelectItem value="athletes">Athletes</SelectItem>
                  <SelectItem value="recruiters">Recruiters</SelectItem>
                  <SelectItem value="parents">Parents</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                  <SelectItem value="all_users">All Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Include Inactive Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-inactive"
                checked={includeInactive}
                onCheckedChange={(checked) => setIncludeInactive(checked as boolean)}
              />
              <Label 
                htmlFor="include-inactive"
                className="text-sm font-normal cursor-pointer"
              >
                Include inactive users
              </Label>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Enter email subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
              />
            </div>

            {/* Send Type */}
            <div className="space-y-3">
              <Label>Send Options</Label>
              <RadioGroup value={sendType} onValueChange={(value) => setSendType(value as "immediate" | "scheduled")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <Label htmlFor="immediate" className="font-normal cursor-pointer">
                    Send immediately
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled" className="font-normal cursor-pointer">
                    Schedule for later
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Schedule Date/Time */}
            {sendType === "scheduled" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule-date">Date *</Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-time">Time *</Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateEmail}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {sendType === "immediate" ? "Send Now" : "Schedule Email"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
