import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, ArrowLeft, BarChart3, Eye, MousePointerClick, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const USER_TYPES = [
  { id: "athlete", label: "Athletes", description: "All student athletes" },
  { id: "parent", label: "Parents", description: "Parents of athletes" },
  { id: "coach", label: "Coaches", description: "All coaches/mentors" },
  { id: "recruiter", label: "Recruiters", description: "College recruiters" },
];

const NOTIFICATION_TYPES = [
  { value: "feature", label: "New Feature" },
  { value: "update", label: "Platform Update" },
  { value: "announcement", label: "Announcement" },
  { value: "reminder", label: "Reminder" },
];

interface Campaign {
  id: string;
  campaign_id: string;
  title: string;
  type: string;
  target_user_types: string[];
  sent_count: number;
  viewed_count: number;
  clicked_count: number;
  sent_at: string;
}

export default function AdminNotifications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "announcement",
    link: "",
  });
  const [selectedUserTypes, setSelectedUserTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleUserTypeToggle = (typeId: string) => {
    setSelectedUserTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const fetchCampaigns = async () => {
    try {
      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from("notification_campaigns")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(20);

      if (campaignsError) throw campaignsError;

      // For each campaign, calculate actual viewed and clicked counts
      const campaignsWithCounts = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          const { data: notifs } = await supabase
            .from("notifications")
            .select("viewed_at, clicked_at")
            .eq("campaign_id", campaign.campaign_id);

          const viewedCount = notifs?.filter(n => n.viewed_at).length || 0;
          const clickedCount = notifs?.filter(n => n.clicked_at).length || 0;

          return {
            ...campaign,
            viewed_count: viewedCount,
            clicked_count: clickedCount,
          };
        })
      );

      setCampaigns(campaignsWithCounts);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!formData.title || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and message",
        variant: "destructive",
      });
      return;
    }

    if (selectedUserTypes.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please select at least one user type",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-bulk-notifications', {
        body: {
          title: formData.title,
          message: formData.message,
          type: formData.type,
          link: formData.link || null,
          targetUserTypes: selectedUserTypes,
        },
      });

      if (error) throw error;

      toast({
        title: "Notifications Sent",
        description: `Successfully sent ${data.count} notifications`,
      });

      // Reset form and refresh analytics
      setFormData({
        title: "",
        message: "",
        type: "announcement",
        link: "",
      });
      setSelectedUserTypes([]);
      fetchCampaigns();

    } catch (error: any) {
      console.error('Error sending notifications:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <Tabs defaultValue="send" className="w-full">
        <TabsList>
          <TabsTrigger value="send">Send Notification</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Send Notification</CardTitle>
            <CardDescription>
              Broadcast messages to users based on their type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="New Feature Available!"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="We've just launched an exciting new feature..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Notification Type</Label>
              <select
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {NOTIFICATION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link (Optional)</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="/feature-page"
              />
              <p className="text-xs text-muted-foreground">
                Users will be redirected here when clicking the notification
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Target Recipients</CardTitle>
              <CardDescription>
                Select which user types should receive this notification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {USER_TYPES.map(type => (
                <div key={type.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <Checkbox
                    id={type.id}
                    checked={selectedUserTypes.includes(type.id)}
                    onCheckedChange={() => handleUserTypeToggle(type.id)}
                  />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor={type.id}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {type.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold text-sm">
                      {formData.title || "Notification Title"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formData.message || "Your notification message will appear here..."}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">Just now</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Recipients: {selectedUserTypes.length > 0 
                  ? selectedUserTypes.map(id => USER_TYPES.find(t => t.id === id)?.label).join(", ")
                  : "None selected"}
              </p>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSend} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Notification
              </>
            )}
          </Button>
        </div>
      </div>
    </TabsContent>

    <TabsContent value="analytics" className="mt-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Campaign Analytics
            </CardTitle>
            <CardDescription>
              View performance metrics for sent notification campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No campaigns sent yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => {
                  const viewRate = campaign.sent_count > 0 
                    ? ((campaign.viewed_count / campaign.sent_count) * 100).toFixed(1)
                    : "0.0";
                  const clickRate = campaign.viewed_count > 0
                    ? ((campaign.clicked_count / campaign.viewed_count) * 100).toFixed(1)
                    : "0.0";

                  return (
                    <Card key={campaign.id} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{campaign.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {new Date(campaign.sent_at).toLocaleString()}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {campaign.type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Send className="h-4 w-4" />
                              <span className="text-xs">Sent</span>
                            </div>
                            <p className="text-2xl font-bold">{campaign.sent_count}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Eye className="h-4 w-4" />
                              <span className="text-xs">Viewed</span>
                            </div>
                            <p className="text-2xl font-bold">{campaign.viewed_count}</p>
                            <p className="text-xs text-muted-foreground">{viewRate}% rate</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MousePointerClick className="h-4 w-4" />
                              <span className="text-xs">Clicked</span>
                            </div>
                            <p className="text-2xl font-bold">{campaign.clicked_count}</p>
                            <p className="text-xs text-muted-foreground">{clickRate}% CTR</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span className="text-xs">Targets</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {campaign.target_user_types.map((type) => (
                                <Badge key={type} variant="secondary" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  </Tabs>
</div>
  );
}
