import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import logoIcon from "@/assets/forswags-logo.png";
import { useMembershipStatus } from "@/hooks/useMembershipStatus";
import { 
  ArrowLeft, 
  Trophy, 
  TrendingUp, 
  GraduationCap, 
  Target, 
  DollarSign,
  MapPin,
  Users,
  Award,
  Star,
  Lock,
  Loader2
} from "lucide-react";

interface School {
  id: string;
  name: string;
  location_city: string;
  location_state: string;
  division: string;
  conference: string;
  enrollment: number;
  tuition: number;
  website_url: string;
}

interface CollegeMatch {
  id: string;
  match_score: number;
  academic_fit: number;
  athletic_fit: number;
  financial_fit: number;
  notes: string | null;
  is_saved: boolean;
  school: School;
}

const PrimeDime = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<CollegeMatch[]>([]);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [athlete, setAthlete] = useState<any>(null);
  const [requesting, setRequesting] = useState(false);
  const { isFree, isLoading: membershipLoading } = useMembershipStatus();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
          return;
        }

        // Get athlete profile
        const { data: athleteData } = await supabase
          .from("athletes")
          .select("id, analysis_requested_at, analysis_notified_at")
          .eq("user_id", session.user.id)
          .single();

        if (!athleteData) {
          toast({
            title: "Not an athlete",
            description: "This feature is only available for athlete profiles.",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }

        setAthleteId(athleteData.id);
        setAthlete(athleteData);

        // Fetch top 10 Prime Dime matches with school details
        const { data: matchesData, error } = await supabase
          .from("college_matches")
          .select(`
            id,
            match_score,
            academic_fit,
            athletic_fit,
            financial_fit,
            notes,
            is_saved,
            schools (
              id,
              name,
              location_city,
              location_state,
              division,
              conference,
              enrollment,
              tuition,
              website_url
            )
          `)
          .eq("athlete_id", athleteData.id)
          .order("match_score", { ascending: false })
          .limit(10);

        if (error) throw error;

        // Transform data to match interface
        const transformedMatches = matchesData?.map((match: any) => ({
          ...match,
          school: match.schools
        })) || [];

        setMatches(transformedMatches);
      } catch (error: any) {
        toast({
          title: "Error loading matches",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [navigate, toast]);

  const getFitColor = (score: number) => {
    if (score >= 80) return "text-secondary";
    if (score >= 60) return "text-primary";
    return "text-muted-foreground";
  };

  const getFitBadge = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Fair";
  };

  const handleRequestAnalysis = async () => {
    setRequesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-prime-dime-analysis');

      if (error) throw error;

      toast({
        title: "Analysis Requested",
        description: "Our team is analyzing your profile. You'll be notified when your Prime Dime matches are ready (usually within 24 hours).",
      });

      // Refresh athlete data to show the "in progress" state
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: athleteData } = await supabase
          .from("athletes")
          .select("id, analysis_requested_at, analysis_notified_at")
          .eq("user_id", session.user.id)
          .single();
        if (athleteData) setAthlete(athleteData);
      }
    } catch (error: any) {
      console.error('Error requesting analysis:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to request Prime Dime analysis",
        variant: "destructive",
      });
    } finally {
      setRequesting(false);
    }
  };

  if (loading || membershipLoading) {
    return (
      <div className="min-h-screen bg-background sports-pattern flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading your Prime Dime...</p>
        </div>
      </div>
    );
  }

  // Check if user has access to Prime Dime (Pro feature)
  if (isFree) {
    return (
      <div className="min-h-screen bg-background sports-pattern">
        <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={logoIcon} alt="ForSWAGs" className="h-12 cursor-pointer" onClick={() => navigate("/")} />
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-gradient-primary">Prime Dime</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Top 10 Prime Dime Matches</p>
              </div>
            </div>
            
            <nav className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto text-center p-12 bg-card/50 backdrop-blur border-2 border-primary/20">
            <div className="mb-6">
              <div className="relative inline-block">
                <Trophy className="h-24 w-24 text-primary mx-auto mb-4" />
                <Lock className="h-8 w-8 text-primary absolute -top-2 -right-2 bg-background rounded-full p-1" />
              </div>
            </div>
            <h2 className="text-3xl font-black uppercase mb-4 text-gradient-accent">
              The Prime Dime is a Pro Feature
            </h2>
            <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
              Get expert college recommendations from our team, tailored to your academic, athletic, and financial profile. 
              Upgrade to Pro to unlock The Prime Dime and find your perfect college fit.
            </p>
            <div className="space-y-4 text-left max-w-md mx-auto mb-8">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Top 10 Prime Dime Matches</p>
                  <p className="text-sm text-muted-foreground">Personalized recommendations based on your profile</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Expert Team Analysis</p>
                  <p className="text-sm text-muted-foreground">Academic, athletic, and financial fit scores</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Expert Insights</p>
                  <p className="text-sm text-muted-foreground">Detailed school information and recommendations</p>
                </div>
              </div>
            </div>
            <Button onClick={() => navigate("/membership")} size="lg" className="w-full max-w-md">
              <Trophy className="mr-2 h-5 w-5" />
              Upgrade to Pro
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sports-pattern">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src={logoIcon} alt="ForSWAGs" className="h-12 cursor-pointer" onClick={() => navigate("/")} />
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-gradient-primary">Prime Dime</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Top 10 Prime Dime Matches</p>
            </div>
          </div>
          
          <nav className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {matches.length === 0 ? (
          <Card className="p-16 text-center bg-card/50 backdrop-blur border-2 border-primary/20">
            {athlete?.analysis_requested_at ? (
              <>
                <div className="relative inline-block mb-6">
                  <Trophy className="h-20 w-20 text-primary mx-auto animate-pulse" />
                </div>
                <h2 className="text-3xl font-black uppercase mb-4 text-gradient-primary">Analysis In Progress</h2>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Our expert team is analyzing your profile to create your Prime Dime matches.
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                  Requested: {new Date(athlete.analysis_requested_at).toLocaleDateString()} at {new Date(athlete.analysis_requested_at).toLocaleTimeString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  You'll receive a notification when your matches are ready (usually within 24 hours)
                </p>
              </>
            ) : (
              <>
                <Trophy className="h-20 w-20 text-primary mx-auto mb-6" />
                <h2 className="text-3xl font-black uppercase mb-4 text-gradient-primary">Get Your Prime Dime</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Request expert Prime Dime analysis from our team. We'll analyze your athletic and academic profile to find your top 10 best-fit colleges.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => navigate("/profile")}>
                    Complete Profile First
                  </Button>
                  <Button 
                    className="btn-accent" 
                    onClick={handleRequestAnalysis}
                    disabled={requesting}
                  >
                    {requesting ? (
                      <>
                        <Trophy className="mr-2 h-4 w-4 animate-spin" />
                        Requesting...
                      </>
                    ) : (
                      <>
                        <Trophy className="mr-2 h-4 w-4" />
                        Request Analysis
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </Card>
        ) : (
          <>
            <div className="mb-8 text-center">
              <div className="inline-flex items-center space-x-2 mb-4">
                <Star className="h-8 w-8 text-secondary fill-secondary" />
                <h2 className="text-4xl font-black uppercase text-gradient-accent">Your Prime Dime</h2>
                <Star className="h-8 w-8 text-secondary fill-secondary" />
              </div>
              <p className="text-muted-foreground uppercase text-sm tracking-wider">
                Your top {matches.length} Prime Dime matches based on your profile
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
              {matches.map((match, index) => (
                <Card key={match.id} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20">
                  <CardHeader className="bg-gradient-to-r from-card to-card/50 border-b-2 border-primary/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge className="bg-gradient-to-r from-secondary to-secondary-glow text-black font-black text-lg px-3 py-1">
                            #{index + 1}
                          </Badge>
                          <Badge variant="outline" className="text-primary border-primary">
                            {match.school.division}
                          </Badge>
                        </div>
                        <CardTitle className="text-2xl font-black uppercase mb-1">
                          {match.school.name}
                        </CardTitle>
                        <CardDescription className="flex items-center text-sm">
                          <MapPin className="h-3 w-3 mr-1" />
                          {match.school.location_city}, {match.school.location_state}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-gradient-primary">
                          {match.match_score?.toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">
                          Overall Match
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6 space-y-4">
                    {/* Conference & Enrollment */}
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Conference</div>
                        <div className="font-bold text-sm">{match.school.conference || "N/A"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          Enrollment
                        </div>
                        <div className="font-bold text-sm">{match.school.enrollment?.toLocaleString() || "N/A"}</div>
                      </div>
                    </div>

                    {/* Fit Scores */}
                    <div className="space-y-3">
                      {/* Academic Fit */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <GraduationCap className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Academic Fit</span>
                          </div>
                          <Badge variant="outline" className={`${getFitColor(match.academic_fit || 0)}`}>
                            {getFitBadge(match.academic_fit || 0)}
                          </Badge>
                        </div>
                        <Progress value={match.academic_fit || 0} className="h-2" />
                      </div>

                      {/* Athletic Fit */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Trophy className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Athletic Fit</span>
                          </div>
                          <Badge variant="outline" className={`${getFitColor(match.athletic_fit || 0)}`}>
                            {getFitBadge(match.athletic_fit || 0)}
                          </Badge>
                        </div>
                        <Progress value={match.athletic_fit || 0} className="h-2" />
                      </div>

                      {/* Financial Fit */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Financial Fit</span>
                          </div>
                          <Badge variant="outline" className={`${getFitColor(match.financial_fit || 0)}`}>
                            {getFitBadge(match.financial_fit || 0)}
                          </Badge>
                        </div>
                        <Progress value={match.financial_fit || 0} className="h-2" />
                      </div>
                    </div>

                    {/* Tuition */}
                    {match.school.tuition && (
                      <div className="pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Annual Tuition</span>
                          <span className="font-bold text-secondary">
                            ${match.school.tuition.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-4 flex space-x-2">
                      <Button 
                        className="flex-1 btn-hero"
                        onClick={() => window.open(match.school.website_url, "_blank")}
                      >
                        <Award className="h-4 w-4 mr-2" />
                        Visit Website
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default PrimeDime;
