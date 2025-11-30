import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Users, MessageSquare, Award, Eye, TrendingUp, Calendar, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";

export default function AlumniDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [alumniData, setAlumniData] = useState<any>(null);
  const [stats, setStats] = useState({
    profileViews: 0,
    connections: 0,
    mentoringSessions: 0,
    impactScore: 0
  });
  const [willingToMentor, setWillingToMentor] = useState(false);
  const [availableForCalls, setAvailableForCalls] = useState(false);

  useEffect(() => {
    loadAlumniData();
  }, []);

  const loadAlumniData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get alumni profile
      const { data: alumni, error: alumniError } = await supabase
        .from("alumni")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (alumniError) {
        toast({
          title: "Error",
          description: "Failed to load alumni profile",
          variant: "destructive"
        });
        return;
      }

      setAlumniData(alumni);
      setWillingToMentor(alumni.willing_to_mentor || false);
      setAvailableForCalls(alumni.available_for_calls || false);

      // Get connection stats
      const { data: connections } = await supabase
        .from("alumni_connections")
        .select("id, status")
        .eq("alumni_id", alumni.id);

      // Get profile view stats (from engagement_metrics or profile_views)
      const { count: viewCount } = await supabase
        .from("engagement_metrics")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action_type", "view");

      setStats({
        profileViews: viewCount || 0,
        connections: connections?.filter(c => c.status === "accepted").length || 0,
        mentoringSessions: connections?.length || 0,
        impactScore: (connections?.length || 0) * 10
      });

    } catch (error) {
      console.error("Error loading alumni data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateMentoringSettings = async (field: string, value: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("alumni")
        .update({ [field]: value })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: "Your mentoring preferences have been saved"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Alumni Dashboard"
        description="Welcome to your alumni dashboard - connect with current athletes and give back to the community"
      />
      
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome Back, Alumni! 🎓</h1>
          <p className="text-muted-foreground">
            Your journey continues - help shape the next generation of athletes
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.profileViews}</div>
              <p className="text-xs text-muted-foreground">Athletes viewing your profile</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connections</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.connections}</div>
              <p className="text-xs text-muted-foreground">Active connections</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mentoring</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mentoringSessions}</div>
              <p className="text-xs text-muted-foreground">Athletes helped</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impact Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.impactScore}</div>
              <p className="text-xs text-muted-foreground">Your community impact</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile & Settings</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="mentoring">Mentoring</TabsTrigger>
            <TabsTrigger value="network">Alumni Network</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Professional Profile</CardTitle>
                <CardDescription>
                  Update your professional information to help current athletes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Current Company</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alumniData?.company || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <Label>Professional Role</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alumniData?.professional_role || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <Label>Sport & Position</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alumniData?.sport} - {alumniData?.position || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label>Graduation Year</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alumniData?.graduation_year}
                    </p>
                  </div>
                </div>
                
                <Button onClick={() => navigate("/profile")}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mentoring Availability</CardTitle>
                <CardDescription>
                  Set your availability to help current athletes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Willing to Mentor</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow athletes to send you connection requests
                    </p>
                  </div>
                  <Switch
                    checked={willingToMentor}
                    onCheckedChange={(checked) => {
                      setWillingToMentor(checked);
                      updateMentoringSettings("willing_to_mentor", checked);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Available for Calls</Label>
                    <p className="text-sm text-muted-foreground">
                      Open to scheduling video/phone calls with athletes
                    </p>
                  </div>
                  <Switch
                    checked={availableForCalls}
                    onCheckedChange={(checked) => {
                      setAvailableForCalls(checked);
                      updateMentoringSettings("available_for_calls", checked);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connections">
            <Card>
              <CardHeader>
                <CardTitle>Your Connections</CardTitle>
                <CardDescription>
                  Athletes you're connected with and pending requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Connection requests and active mentoring relationships will appear here
                </p>
                <Button className="mt-4" onClick={() => navigate("/alumni/network")}>
                  <Users className="mr-2 h-4 w-4" />
                  Browse Athletes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentoring">
            <Card>
              <CardHeader>
                <CardTitle>Mentoring Dashboard</CardTitle>
                <CardDescription>
                  Manage your mentoring sessions and impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No active mentoring sessions yet
                  </p>
                  <Button variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Set Up Availability
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network">
            <Card>
              <CardHeader>
                <CardTitle>Alumni Network</CardTitle>
                <CardDescription>
                  Connect with fellow alumni and share experiences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Discover and connect with alumni from your sport and school
                </p>
                <Button onClick={() => navigate("/alumni/network")}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Explore Network
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
