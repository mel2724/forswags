import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import NotificationCard from "@/components/NotificationCard";
import SponsorCard from "@/components/SponsorCard";
import { InteractiveTutorial } from "@/components/InteractiveTutorial";
import { useBadgeListener } from "@/hooks/useBadgeListener";
import { ParentConsentManager } from "@/components/ParentConsentManager";
import { differenceInYears } from "date-fns";
import {
  LogOut, Users, Trophy, GraduationCap, Calendar, 
  School, Award, Plus, Eye, MapPin, Shield, BookOpen, PlayCircle, TrendingUp
} from "lucide-react";

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [athleteEmail, setAthleteEmail] = useState("");
  const [linkingDialogOpen, setLinkingDialogOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [learningProgress, setLearningProgress] = useState<Record<string, { videosWatched: number; badgesEarned: number; badges: any[] }>>({});
  const [creatingTestAthlete, setCreatingTestAthlete] = useState(false);

  // Listen for badge achievements
  useBadgeListener(user?.id);

  useEffect(() => {
    const checkAuth = async () => {
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

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/auth");
          return;
        }

        setUser(session.user);

      // Get profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      setProfile(profileData);

      // Check if parent should see tutorial
      if (profileData && !profileData.tutorial_completed) {
        const progress = (profileData.tutorial_progress || {}) as Record<string, boolean>;
        if (!progress.parent_tutorial) {
          setShowTutorial(true);
        }
      }

      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (roleData?.role !== "parent") {
        navigate("/dashboard");
        return;
      }

      // Get athletes linked to this parent
      await loadAthletes(session.user.id);
      
      // Load pending verifications for this parent
      await loadPendingVerifications(session.user.email!);

      } catch (error) {
        console.error("Error loading parent dashboard:", error);
        toast.error("Failed to load dashboard data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleTutorialComplete = async () => {
    setShowTutorial(false);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ tutorial_completed: true })
        .eq("id", user?.id);
      
      if (error) throw error;
      toast.success("Tutorial completed! 🎉");
    } catch (error) {
      console.error("Error completing tutorial:", error);
    }
  };

  const loadAthletes = async (parentId: string) => {
    const { data: athletesData } = await supabase
      .from("athletes")
      .select(`
        *,
        profiles!athletes_user_id_fkey (
          full_name,
          email
        )
      `)
      .eq("parent_id", parentId);

    setAthletes(athletesData || []);
    
    // Load learning progress for each athlete
    if (athletesData) {
      await loadLearningProgress(athletesData);
    }
  };

  const loadLearningProgress = async (athletesData: any[]) => {
    const progressData: Record<string, { videosWatched: number; badgesEarned: number; badges: any[] }> = {};
    
    for (const athlete of athletesData) {
      // Get video completions
      const { data: completions } = await supabase
        .from("video_completions")
        .select("id")
        .eq("user_id", athlete.user_id);

      // Get badges earned
      const { data: userBadges } = await supabase
        .from("user_badges")
        .select(`
          badge_id,
          earned_at,
          badges (
            id,
            name,
            description,
            icon
          )
        `)
        .eq("user_id", athlete.user_id)
        .order("earned_at", { ascending: false })
        .limit(3);

      progressData[athlete.id] = {
        videosWatched: completions?.length || 0,
        badgesEarned: userBadges?.length || 0,
        badges: userBadges || []
      };
    }
    
    setLearningProgress(progressData);
  };

  const loadPendingVerifications = async (parentEmail: string) => {
    const { data } = await supabase
      .from("parent_verifications")
      .select(`
        *,
        athletes (
          id,
          user_id,
          sport,
          position,
          high_school,
          graduation_year,
          profiles!athletes_user_id_fkey (
            full_name,
            email
          )
        )
      `)
      .eq("parent_email", parentEmail.toLowerCase())
      .is("verified_at", null)
      .gt("expires_at", new Date().toISOString());

    setPendingVerifications(data || []);
  };

  const handleVerifyCode = async () => {
    if (!selectedVerification || !verificationCode.trim()) {
      toast.error("Please enter the verification code");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-parent-code", {
        body: {
          verification_code: verificationCode.trim().toUpperCase(),
          parent_email: user.email,
        },
      });

      if (error) throw error;

      if (data.valid) {
        toast.success("Child verified successfully!");
        setVerificationCode("");
        setVerificationDialogOpen(false);
        setSelectedVerification(null);
        await loadAthletes(user.id);
        await loadPendingVerifications(user.email!);
      } else {
        toast.error(data.error || "Invalid verification code");
      }
    } catch (error: any) {
      toast.error(error.message || "Error verifying code");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAthlete = async () => {
    if (!user || !athleteEmail.trim()) {
      toast.error("Please enter athlete's email");
      return;
    }

    setLoading(true);

    try {
      // Find athlete by email
      const { data: athleteProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", athleteEmail.trim().toLowerCase())
        .maybeSingle();

      if (!athleteProfile) {
        toast.error("No athlete found with that email");
        return;
      }

      // Check if athlete profile exists
      const { data: athleteData } = await supabase
        .from("athletes")
        .select("id, parent_id")
        .eq("user_id", athleteProfile.id)
        .maybeSingle();

      if (!athleteData) {
        toast.error("This user is not an athlete");
        return;
      }

      if (athleteData.parent_id && athleteData.parent_id !== user.id) {
        toast.error("This athlete is already linked to another parent");
        return;
      }

      // Link athlete to parent
      const { error } = await supabase
        .from("athletes")
        .update({ parent_id: user.id })
        .eq("id", athleteData.id);

      if (error) throw error;

      toast.success("Athlete linked successfully!");
      setAthleteEmail("");
      setLinkingDialogOpen(false);
      await loadAthletes(user.id);
    } catch (error: any) {
      toast.error(error.message || "Error linking athlete");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAthlete = (athleteUserId: string) => {
    // Store the athlete user ID in session storage for parent viewing
    sessionStorage.setItem("parent_viewing_athlete", athleteUserId);
    navigate("/dashboard");
  };

  const handleSignOut = async () => {
    sessionStorage.removeItem("parent_viewing_athlete");
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  const handleCreateTestAthlete = async () => {
    setCreatingTestAthlete(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-test-athlete");
      
      if (error) throw error;
      
      if (data.success) {
        toast.success("Tyler Brown created! Check pending verifications below.");
        toast.info(`Verification code: ${data.verification.verificationCode}`);
        
        // Reload verifications
        await loadPendingVerifications(user.email!);
      } else {
        toast.error(data.error || "Failed to create test athlete");
      }
    } catch (error: any) {
      console.error("Error creating test athlete:", error);
      toast.error(error.message || "Failed to create test athlete");
    } finally {
      setCreatingTestAthlete(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-fade-in p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-5 w-40" />
            </div>
          </div>

          {/* Athletes Cards Skeleton */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sports-pattern">
      <InteractiveTutorial
        onComplete={handleTutorialComplete}
        enabled={showTutorial}
        role="parent"
      />
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/forswags-logo.png" alt="ForSWAGs" className="h-12" />
          </div>
          
          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <Button variant="ghost" onClick={handleSignOut} className="text-primary hover:text-primary/80 font-bold">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-2 uppercase tracking-tight">
            Welcome, {profile?.full_name?.split(' ')[0] || "Parent"}!
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Badge variant="secondary" className="uppercase font-bold">
              <Users className="h-3 w-3 mr-1" />
              Parent Account
            </Badge>
          </p>
        </div>

        {/* Notifications */}
        <div className="mb-8">
          <NotificationCard />
          
          {/* Sponsor Card */}
          <SponsorCard />
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="uppercase tracking-tight flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Learning Resources & Testing
            </CardTitle>
            <CardDescription>
              Access educational content and create test accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => navigate("/playbook-for-life")} 
              className="w-full gap-2"
              size="lg"
            >
              <GraduationCap className="h-5 w-5" />
              Playbook for Life
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Life skills videos covering focus, respect, finances, leadership, and more
            </p>
            
            <Separator />
            
            <div className="pt-2">
              <Button 
                onClick={handleCreateTestAthlete}
                disabled={creatingTestAthlete}
                variant="outline"
                className="w-full gap-2"
                size="lg"
              >
                <Users className="h-5 w-5" />
                {creatingTestAthlete ? "Creating..." : "Create Test Athlete (Tyler Brown)"}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Creates a 14-year-old minor athlete account for testing parent verification
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Learning Progress Overview */}
        {athletes.length > 0 && (
          <Card className="mb-8 bg-card/80 backdrop-blur border-2 border-secondary/20">
            <CardHeader>
              <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                Learning Progress
              </CardTitle>
              <CardDescription>
                Track your children's educational achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {athletes.map((athlete) => {
                  const progress = learningProgress[athlete.id] || { videosWatched: 0, badgesEarned: 0, badges: [] };
                  
                  return (
                    <Card key={athlete.id} className="bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-lg">
                              {athlete.profiles?.full_name || "Athlete"}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {athlete.sport} • Class of {athlete.graduation_year}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                            <PlayCircle className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-2xl font-bold">{progress.videosWatched}</p>
                              <p className="text-xs text-muted-foreground">Videos Watched</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/5">
                            <Award className="h-5 w-5 text-secondary" />
                            <div>
                              <p className="text-2xl font-bold">{progress.badgesEarned}</p>
                              <p className="text-xs text-muted-foreground">Badges Earned</p>
                            </div>
                          </div>
                        </div>

                        {progress.badges.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                              Recent Badges
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {progress.badges.map((userBadge: any) => (
                                <Badge 
                                  key={userBadge.badge_id} 
                                  variant="secondary"
                                  className="gap-1"
                                >
                                  {userBadge.badges.icon && <span>{userBadge.badges.icon}</span>}
                                  {userBadge.badges.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {progress.videosWatched === 0 && progress.badgesEarned === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            No learning activity yet. Encourage them to start watching videos!
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Verifications */}
        {pendingVerifications.length > 0 && (
          <Card className="bg-orange-500/10 border-2 border-orange-500/20">
            <CardHeader>
              <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                Pending Verifications
              </CardTitle>
              <CardDescription>
                Your children need parental consent to create public profiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingVerifications.map((verification) => (
                  <Card key={verification.id} className="bg-card/50 border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-1">
                            {verification.athletes?.profiles?.full_name || "Athlete"}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {verification.athletes?.profiles?.email}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            {verification.athletes?.sport && (
                              <span className="flex items-center gap-1">
                                <Trophy className="h-3 w-3" />
                                {verification.athletes.sport}
                              </span>
                            )}
                            {verification.athletes?.graduation_year && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Class of {verification.athletes.graduation_year}
                              </span>
                            )}
                          </div>
                        </div>
                        <Dialog 
                          open={verificationDialogOpen && selectedVerification?.id === verification.id} 
                          onOpenChange={(open) => {
                            setVerificationDialogOpen(open);
                            if (!open) {
                              setSelectedVerification(null);
                              setVerificationCode("");
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => setSelectedVerification(verification)}
                              className="bg-orange-500 hover:bg-orange-600"
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Verify Now
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Verify Parental Consent</DialogTitle>
                              <DialogDescription>
                                Enter the 6-digit verification code that was sent to your email
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="verification-code">Verification Code</Label>
                                <Input
                                  id="verification-code"
                                  placeholder="ABC123"
                                  value={verificationCode}
                                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                                  maxLength={6}
                                  className="text-center text-2xl font-mono tracking-widest uppercase"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Check your email ({user?.email}) for the code
                                </p>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setVerificationDialogOpen(false);
                                  setSelectedVerification(null);
                                  setVerificationCode("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleVerifyCode} disabled={loading || verificationCode.length !== 6}>
                                {loading ? "Verifying..." : "Verify & Grant Consent"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Athletes Grid */}
        <div className="grid gap-6">
          <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Your Athletes
                  </CardTitle>
                  <CardDescription>View and manage your athletes' profiles</CardDescription>
                </div>
                <Dialog open={linkingDialogOpen} onOpenChange={setLinkingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Link Athlete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Link an Athlete</DialogTitle>
                      <DialogDescription>
                        Enter the email address of the athlete you want to link to your account
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="athlete-email">Athlete's Email</Label>
                        <Input
                          id="athlete-email"
                          type="email"
                          placeholder="athlete@email.com"
                          value={athleteEmail}
                          onChange={(e) => setAthleteEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setLinkingDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleLinkAthlete} disabled={loading}>
                        {loading ? "Linking..." : "Link Athlete"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {athletes.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {athletes.map((athlete) => {
                    const isMinor = athlete.date_of_birth 
                      ? differenceInYears(new Date(), new Date(athlete.date_of_birth)) < 18
                      : false;

                    return (
                      <Card key={athlete.id} className="bg-card/50 backdrop-blur border-2 border-primary/10 hover:border-primary/30 transition-colors">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-black text-xl">
                                    {athlete.profiles?.full_name || "Athlete"}
                                  </h3>
                                  {isMinor && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Minor
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {athlete.profiles?.email}
                                </p>
                              </div>
                            </div>

                            {/* Athletic Info */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm">
                                <Trophy className="h-4 w-4 text-primary" />
                                <span className="font-semibold">{athlete.sport}</span>
                                {athlete.position && (
                                  <span className="text-muted-foreground">• {athlete.position}</span>
                                )}
                              </div>

                              {athlete.high_school && (
                                <div className="flex items-center gap-2 text-sm">
                                  <School className="h-4 w-4 text-secondary" />
                                  <span className="truncate">{athlete.high_school}</span>
                                </div>
                              )}

                              {athlete.graduation_year && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  <span>Class of {athlete.graduation_year}</span>
                                </div>
                              )}

                              {athlete.gpa && (
                                <div className="flex items-center gap-2 text-sm">
                                  <GraduationCap className="h-4 w-4 text-secondary" />
                                  <span>GPA: {athlete.gpa.toFixed(2)}</span>
                                </div>
                              )}
                            </div>

                            {/* Consent Management (only for minors) */}
                            {isMinor && (
                              <>
                                <Separator />
                                <ParentConsentManager 
                                  athlete={athlete} 
                                  onConsentUpdate={() => loadAthletes(user.id)}
                                />
                              </>
                            )}

                            {/* View Dashboard Button */}
                            <Button 
                              onClick={() => handleViewAthlete(athlete.user_id)}
                              className="w-full"
                              variant="default"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Dashboard
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-bold mb-2">No Athletes Linked</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Link your athlete's account to view their profile and progress
                  </p>
                  <Button onClick={() => setLinkingDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Link First Athlete
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ParentDashboard;
