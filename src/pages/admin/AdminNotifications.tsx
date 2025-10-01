import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, ArrowLeft } from "lucide-react";

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

export default function AdminNotifications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "announcement",
    link: "",
  });
  const [selectedUserTypes, setSelectedUserTypes] = useState<string[]>([]);

  const handleUserTypeToggle = (typeId: string) => {
    setSelectedUserTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
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

      // Reset form
      setFormData({
        title: "",
        message: "",
        type: "announcement",
        link: "",
      });
      setSelectedUserTypes([]);

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
    </div>
  );
}
