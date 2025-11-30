import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, Save, Bell, Users, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NotificationCard from "@/components/NotificationCard";
import { InteractiveTutorial } from "@/components/InteractiveTutorial";

export default function RecruiterDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Clear old data if localStorage is full
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
      } catch (e) {
        // localStorage full, clear some space
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && !key.includes('supabase.auth.token')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has recruiter role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isRecruiter = roles?.some(r => r.role === "recruiter");
      if (!isRecruiter) {
        toast({
          title: "Access Denied",
          description: "You need college scout access to view this page",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      // Verify recruiter profile exists
      const { data: recruiterProfileCheck } = await supabase
        .from("recruiter_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!recruiterProfileCheck) {
        toast({
          title: "Profile Incomplete",
          description: "Please complete your recruiter profile setup",
          variant: "destructive",
        });
        navigate("/recruiter/profile");
        return;
      }

      // Get user profile for tutorial status
      const { data: userProfileData } = await supabase
        .from("profiles")
        .select("tutorial_completed, tutorial_progress")
        .eq("id", user.id)
        .single();

      setUserProfile(userProfileData);

      // Check if recruiter should see tutorial
      if (userProfileData && !userProfileData.tutorial_completed) {
        const progress = (userProfileData.tutorial_progress || {}) as Record<string, boolean>;
        if (!progress.recruiter_tutorial) {
          setShowTutorial(true);
        }
      }

      // Fetch recruiter profile
      const { data: profileData } = await supabase
        .from("recruiter_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setProfile(profileData);

      // Fetch saved searches
      const { data: searches } = await supabase
        .from("saved_searches")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setSavedSearches(searches || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTutorialComplete = async () => {
    setShowTutorial(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({ tutorial_completed: true })
          .eq("id", user.id);
        
        if (error) throw error;
        toast({ title: "Tutorial completed! 🎉" });
      }
    } catch (error) {
      console.error("Error completing tutorial:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <InteractiveTutorial
        onComplete={handleTutorialComplete}
        enabled={showTutorial}
        role="recruiter"
      />
      <div>
        <h1 className="text-3xl font-bold mb-2">College Scout Dashboard</h1>
        <p className="text-muted-foreground">
          {profile ? `Welcome, ${profile.title} at ${profile.school_name}` : "Complete your profile to get started"}
        </p>
      </div>

      <div className="mb-8">
        <NotificationCard />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Search Athletes</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/recruiter/search")} className="w-full">
              Find Prospects
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Searches</CardTitle>
            <Save className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savedSearches.length}</div>
            <p className="text-xs text-muted-foreground">Active searches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => navigate("/recruiter/preferences")} 
              className="w-full"
            >
              Manage
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Profile</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => navigate("/recruiter/profile")} 
              className="w-full"
            >
              Edit Profile
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Saved Searches</CardTitle>
          <CardDescription>Quick access to your frequently used searches</CardDescription>
        </CardHeader>
        <CardContent>
          {savedSearches.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">No saved searches yet</p>
              <Button onClick={() => navigate("/recruiter/search")}>
                Create Your First Search
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {savedSearches.map((search) => (
                <Card key={search.id} className="p-4 hover:bg-accent cursor-pointer transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{search.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(search.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => navigate(`/recruiter/search?saved=${search.id}`)}
                    >
                      View Results
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
