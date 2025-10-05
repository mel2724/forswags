import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import AthleteAnalytics from "@/components/AthleteAnalytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import logoIcon from "@/assets/forswags-logo.png";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import NotificationCard from "@/components/NotificationCard";
import SponsorCard from "@/components/SponsorCard";
import { UpgradeNudge } from "@/components/UpgradeNudge";
import {
  Trophy, GraduationCap, FileText, Star, LogOut, TrendingUp, 
  School, Target, CheckCircle2, Clock, Edit, BarChart3,
  Video, User, MapPin, Calendar, Award, Share2
} from "lucide-react";

const Dashboard = () => {
  let navigate;
  try {
    navigate = useNavigate();
  } catch (error) {
    // During HMR, router context might not be available
    console.warn('Router context not available, will reload...');
    setTimeout(() => window.location.reload(), 500);
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [athlete, setAthlete] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [membership, setMembership] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const { isImpersonating, getEffectiveUserId } = useImpersonation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if parent is viewing athlete's dashboard
      const parentViewingAthlete = sessionStorage.getItem("parent_viewing_athlete");
      
      // Use impersonated user if available, parent viewing if available, otherwise use actual session user
      const effectiveUserId = getEffectiveUserId() || parentViewingAthlete || session.user.id;
      setUser(session.user);

      // Get profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", effectiveUserId)
        .maybeSingle();

      setProfile(profileData);

      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", effectiveUserId)
        .maybeSingle();

      if (roleData) {
        setRole(roleData.role);
        
        // If parent role, redirect to parent dashboard unless viewing athlete
        if (roleData.role === "parent" && !parentViewingAthlete) {
          navigate("/parent/dashboard");
          return;
        }
        
        // If athlete, get athlete data
        if (roleData.role === "athlete") {
          const { data: athleteData } = await supabase
            .from("athletes")
            .select("*")
            .eq("user_id", effectiveUserId)
            .maybeSingle();
          
          setAthlete(athleteData);

          // Get college matches
          if (athleteData) {
            const { data: matchesData } = await supabase
              .from("college_matches")
              .select(`
                *,
                schools (
                  name,
                  location_city,
                  location_state,
                  division,
                  conference
                )
              `)
              .eq("athlete_id", athleteData.id)
              .order("match_score", { ascending: false })
              .limit(3);
            
            setMatches(matchesData || []);

            // Get athlete stats
            const { data: statsData } = await supabase
              .from("athlete_stats")
              .select("*")
              .eq("athlete_id", athleteData.id)
              .order("season", { ascending: false })
              .limit(5);
            
            setStats(statsData || []);

            // Get offers
            const { data: offersData } = await supabase
              .from("college_offers")
              .select("*")
              .eq("athlete_id", athleteData.id);
            
            setOffers(offersData || []);
          }
        }
      }

      // Get membership
      const { data: membershipData } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", effectiveUserId)
        .maybeSingle();
      
      setMembership(membershipData);

      setLoading(false);
    };

    checkAuth();
  }, [navigate, getEffectiveUserId]);

  const profileCompleteness = () => {
    if (!athlete) return 0;
    const fields = [
      athlete.sport,
      athlete.position,
      athlete.height_in,
      athlete.weight_lb,
      athlete.high_school,
      athlete.graduation_year,
      athlete.gpa,
      athlete.sat_score || athlete.act_score,
      athlete.highlights_url,
      athlete.bio
    ];
    const filled = fields.filter(f => f).length;
    return Math.round((filled / fields.length) * 100);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const parentViewingAthlete = sessionStorage.getItem("parent_viewing_athlete");

  const handleBackToParentDashboard = () => {
    sessionStorage.removeItem("parent_viewing_athlete");
    navigate("/parent/dashboard");
  };

  return (
    <div className="min-h-screen bg-background sports-pattern">
      {isImpersonating && <div className="h-14" />}
      {parentViewingAthlete && (
        <div className="bg-secondary/20 border-b border-secondary">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <p className="text-sm font-medium">Viewing athlete's dashboard as parent</p>
            <Button size="sm" variant="outline" onClick={handleBackToParentDashboard}>
              Back to Parent Dashboard
            </Button>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80" style={{ marginTop: isImpersonating ? '52px' : '0' }}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoIcon} alt="ForSWAGs" className="h-12" />
          </div>
          
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Button variant="ghost" onClick={() => navigate("/players")} className="text-primary hover:text-primary/80 font-bold">
              Athletes
            </Button>
            <Button variant="ghost" onClick={() => navigate("/rankings")} className="text-primary hover:text-primary/80 font-bold">
              Rankings
            </Button>
            <Button variant="ghost" onClick={() => navigate("/badges")} className="text-primary hover:text-primary/80 font-bold">
              Badges
            </Button>
            {role === "admin" && (
              <Button variant="ghost" onClick={() => navigate("/admin")} className="text-primary hover:text-primary/80 font-bold">
                Admin
              </Button>
            )}
          </nav>

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
            Welcome back, {profile?.full_name?.split(' ')[0] || "Athlete"}!
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Badge variant="secondary" className="uppercase font-bold">
              {membership?.plan || "Free"} Plan
            </Badge>
            {role && (
              <span className="text-sm capitalize">• {role}</span>
            )}
          </p>
        </div>

        {role === "athlete" && athlete ? (
          <div className="grid gap-6">
            {/* Profile Completion */}
            <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="uppercase tracking-tight">Profile Strength</CardTitle>
                    <CardDescription>Complete your profile to attract more colleges</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate("/stats")}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Stats
                    </Button>
                    <Button size="sm" onClick={() => navigate("/offers")}>
                      <Award className="h-4 w-4 mr-2" />
                      Offers
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{profileCompleteness()}% Complete</span>
                    <span className="text-muted-foreground">
                      {profileCompleteness() === 100 ? "All set!" : "Keep going!"}
                    </span>
                  </div>
                  <Progress value={profileCompleteness()} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Notifications Card */}
            <NotificationCard />

            {/* Stats Overview */}
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-card/50 backdrop-blur border-2 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wide">Sport</p>
                      <p className="text-2xl font-black mt-1">{athlete.sport}</p>
                      {athlete.position && (
                        <p className="text-xs text-muted-foreground mt-1">{athlete.position}</p>
                      )}
                    </div>
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-2 border-secondary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wide">Class Of</p>
                      <p className="text-2xl font-black mt-1">{athlete.graduation_year || "N/A"}</p>
                      {athlete.high_school && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{athlete.high_school}</p>
                      )}
                    </div>
                    <Calendar className="h-8 w-8 text-secondary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-2 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wide">GPA</p>
                      <p className="text-2xl font-black mt-1">{athlete.gpa?.toFixed(2) || "N/A"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {athlete.sat_score ? `SAT: ${athlete.sat_score}` : athlete.act_score ? `ACT: ${athlete.act_score}` : "No test scores"}
                      </p>
                    </div>
                    <GraduationCap className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-2 border-secondary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wide">Matches</p>
                      <p className="text-2xl font-black mt-1">{matches.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">College options</p>
                    </div>
                    <School className="h-8 w-8 text-secondary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-2 border-primary/20 cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/offers")}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wide">Offers</p>
                      <p className="text-2xl font-black mt-1">{offers.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Active offers</p>
                    </div>
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upgrade Nudge for Free Users */}
            {membership?.plan === "free" && (
              <UpgradeNudge
                title="Unlock Your Full Athletic Potential"
                description="Get unlimited evaluations, advanced analytics, AI-powered content, and priority access to college recruiters"
                variant="full"
                highlight="Pro members get 3x more profile views from recruiters"
                dismissible={true}
              />
            )}

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* College Matches */}
              <Card className="lg:col-span-2 bg-card/80 backdrop-blur border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Top College Matches
                      </CardTitle>
                      <CardDescription>Our team's recommendations based on your profile</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate("/prime-dime")}>
                      View Prime Dime
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {matches.length > 0 ? (
                    <div className="space-y-4">
                      {matches.map((match) => (
                        <div key={match.id} className="p-4 rounded-lg border border-border hover:border-primary transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold">{match.schools?.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {match.schools?.division}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {match.schools?.location_city}, {match.schools?.location_state}
                                </span>
                                {match.schools?.conference && (
                                  <span>{match.schools.conference}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-black text-primary">
                                {match.match_score?.toFixed(0)}%
                              </div>
                              <p className="text-xs text-muted-foreground">Match</p>
                            </div>
                          </div>
                          <Separator className="my-3" />
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Academic</p>
                              <p className="font-semibold">{match.academic_fit?.toFixed(0)}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Athletic</p>
                              <p className="font-semibold">{match.athletic_fit?.toFixed(0)}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Financial</p>
                              <p className="font-semibold">{match.financial_fit?.toFixed(0)}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="font-bold mb-2">No Matches Yet</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Complete your profile to get personalized college recommendations
                      </p>
                      <Button onClick={() => navigate("/profile")}>
                        Complete Profile
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="bg-card/80 backdrop-blur border-2 border-secondary/20">
                <CardHeader>
                  <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                    Next Steps
                  </CardTitle>
                  <CardDescription>Maximize your recruiting potential</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profileCompleteness() < 100 && (
                      <div className="flex gap-3 p-3 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/profile")}>
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-sm mb-1">Complete Your Profile</h5>
                          <p className="text-xs text-muted-foreground">Add missing information to improve visibility</p>
                        </div>
                      </div>
                    )}

                    {!athlete.highlights_url && (
                      <div className="flex gap-3 p-3 rounded-lg border border-border hover:border-secondary transition-colors cursor-pointer" onClick={() => navigate("/profile")}>
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
                            <Video className="h-4 w-4 text-secondary" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-sm mb-1">Upload Highlights</h5>
                          <p className="text-xs text-muted-foreground">Showcase your best plays to coaches</p>
                        </div>
                      </div>
                    )}

                    {stats.length === 0 && (
                      <div className="flex gap-3 p-3 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/stats")}>
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <BarChart3 className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-sm mb-1">Add Your Stats</h5>
                          <p className="text-xs text-muted-foreground">Track your performance metrics</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 p-3 rounded-lg border border-border hover:border-secondary transition-colors cursor-pointer" onClick={() => navigate("/preferences")}>
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
                          <Target className="h-4 w-4 text-secondary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm mb-1">Set College Preferences</h5>
                        <p className="text-xs text-muted-foreground">Define your ideal college criteria</p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/media")}>
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Video className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm mb-1">Media Gallery</h5>
                        <p className="text-xs text-muted-foreground">Upload introduction and community videos</p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/prime-dime")}>
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Star className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm mb-1">View Prime Dime</h5>
                        <p className="text-xs text-muted-foreground">Check your top 10 college matches</p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-lg border border-border hover:border-secondary transition-colors cursor-pointer" onClick={() => navigate("/courses")}>
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
                          <GraduationCap className="h-4 w-4 text-secondary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm mb-1">Playbook for Life</h5>
                        <p className="text-xs text-muted-foreground">Master skills on and off the field</p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/badges")}>
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Award className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm mb-1">View Achievements</h5>
                        <p className="text-xs text-muted-foreground">Track your badges and milestones</p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-lg border border-border hover:border-secondary transition-colors cursor-pointer" onClick={() => navigate("/evaluations")}>
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
                          <Star className="h-4 w-4 text-secondary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm mb-1">Coach Evaluations</h5>
                        <p className="text-xs text-muted-foreground">Professional coach assessment</p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/social")}>
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Share2 className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm mb-1">Social Media</h5>
                        <p className="text-xs text-muted-foreground">Create and share your content</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sponsor Card */}
              <SponsorCard />
            </div>

            {/* Analytics Section */}
            <div className="mt-6">
              <AthleteAnalytics />
            </div>
          </div>
        ) : (
          // Non-athlete dashboard
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 bg-card/50 backdrop-blur border-2 border-primary/20 hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer group" onClick={() => navigate("/players")}>
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2 uppercase tracking-tight">Athletes</h3>
              <p className="text-sm text-muted-foreground">Browse athlete profiles and talent</p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur border-2 border-secondary/20 hover:border-secondary hover:shadow-xl hover:shadow-secondary/20 transition-all duration-300 cursor-pointer group" onClick={() => navigate("/courses")}>
              <div className="p-3 bg-secondary/10 rounded-lg w-fit mb-4 group-hover:bg-secondary/20 transition-colors">
                <GraduationCap className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-bold text-lg mb-2 uppercase tracking-tight">Playbook for Life</h3>
              <p className="text-sm text-muted-foreground">Master the game on and off the field</p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur border-2 border-primary/20 hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer group" onClick={() => navigate("/badges")}>
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2 uppercase tracking-tight">Achievements</h3>
              <p className="text-sm text-muted-foreground">Earn badges and track milestones</p>
            </Card>

            {role === "admin" && (
              <Card className="p-6 bg-card/50 backdrop-blur border-2 border-secondary/20 hover:border-secondary hover:shadow-xl hover:shadow-secondary/20 transition-all duration-300 cursor-pointer group" onClick={() => navigate("/admin")}>
                <div className="p-3 bg-secondary/10 rounded-lg w-fit mb-4 group-hover:bg-secondary/20 transition-colors">
                  <Star className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="font-bold text-lg mb-2 uppercase tracking-tight">Admin</h3>
                <p className="text-sm text-muted-foreground">Platform management and settings</p>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;