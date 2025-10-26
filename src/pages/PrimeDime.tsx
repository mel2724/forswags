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
import { PrimeDimeAdvisor } from "@/components/PrimeDimeAdvisor";
import { generatePrimeDimePDF } from "@/lib/pdfGenerator";
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
  Loader2,
  ExternalLink,
  Download,
  Mail,
  Phone
} from "lucide-react";


const PrimeDime = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [conversationCompleted, setConversationCompleted] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [generationError, setGenerationError] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { isFree, isLoading: membershipLoading } = useMembershipStatus();

  useEffect(() => {
    fetchAthleteAndRecommendations();
  }, []);

  const fetchAthleteAndRecommendations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Get athlete profile
      const { data: athlete, error: athleteError } = await supabase
        .from('athletes')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (athleteError) {
        toast({
          title: "Not an athlete",
          description: "This feature is only available for athlete profiles.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }
      
      setAthleteId(athlete.id);

      // Check conversation status
      const { data: prefs } = await supabase
        .from('college_match_prefs')
        .select('conversation_completed')
        .eq('athlete_id', athlete.id)
        .maybeSingle();

      setConversationCompleted(prefs?.conversation_completed || false);

      // Fetch recommendations if completed
      if (prefs?.conversation_completed) {
        await fetchRecommendations(athlete.id);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load Prime Dime data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (athleteId: string, shouldGenerate = false) => {
    setIsGenerating(true);
    setGenerationError(false);
    
    // If we should generate, trigger the generation function first
    if (shouldGenerate) {
      console.log('[PrimeDime] Manually triggering recommendation generation...');
      try {
        const { data, error } = await supabase.functions.invoke('generate-prime-dime-recommendations', {
          body: { athleteId }
        });
        
        console.log('[PrimeDime] Generation response:', { data, error });
        
        if (error) {
          console.error('[PrimeDime] Error generating recommendations:', error);
          toast({
            title: "Generation Error",
            description: error.message || "Failed to generate recommendations",
            variant: "destructive",
          });
          setGenerationError(true);
          setIsGenerating(false);
          return;
        }
        
        toast({
          title: "Success!",
          description: "Your recommendations have been generated",
        });
      } catch (err: any) {
        console.error('[PrimeDime] Exception generating:', err);
        toast({
          title: "Error",
          description: err.message || "Failed to start generation",
          variant: "destructive",
        });
        setGenerationError(true);
        setIsGenerating(false);
        return;
      }
    }
    
    // Set a timeout to detect stuck generation
    const timeout = setTimeout(() => {
      setGenerationError(true);
      setIsGenerating(false);
    }, 60000); // 60 seconds timeout
    
    try {
      const { data, error } = await supabase
        .from('college_recommendations')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      clearTimeout(timeout);

      if (error) {
        console.error('Error fetching recommendations:', error);
        setGenerationError(true);
        setIsGenerating(false);
        return;
      }

      if (data) {
        setRecommendations(data.recommendations);
        setIsGenerating(false);
      } else if (!shouldGenerate) {
        // No data yet, keep checking (only if we didn't just generate)
        setTimeout(() => fetchRecommendations(athleteId), 3000);
      } else {
        // We just generated but no data yet, wait a bit longer
        setTimeout(() => fetchRecommendations(athleteId), 5000);
      }
    } catch (error) {
      clearTimeout(timeout);
      console.error('Exception fetching recommendations:', error);
      setGenerationError(true);
      setIsGenerating(false);
    }
  };

  const handleStartAdvisor = () => {
    setShowAdvisor(true);
  };

  const handleAdvisorComplete = async () => {
    setShowAdvisor(false);
    setConversationCompleted(true);
    setGenerationError(false);
    if (athleteId) {
      await fetchRecommendations(athleteId);
    }
  };

  const handleRetry = () => {
    setGenerationError(false);
    setRecommendations(null);
    if (athleteId) {
      fetchRecommendations(athleteId, true); // Force generation
    }
  };

  const handleRestart = () => {
    setConversationCompleted(false);
    setRecommendations(null);
    setGenerationError(false);
    setShowAdvisor(true);
  };

  const handleExport = async () => {
    if (!recommendations || !athleteId) return;

    try {
      // Fetch athlete and profile data
      const { data: athleteData, error: athleteError } = await supabase
        .from('athletes')
        .select(`
          position, 
          graduation_year, 
          gpa, 
          sport,
          profiles!inner(full_name)
        `)
        .eq('id', athleteId)
        .single();

      if (athleteError || !athleteData) {
        toast({
          title: "Error",
          description: "Could not fetch athlete profile",
          variant: "destructive",
        });
        return;
      }

      // Prepare athlete profile for PDF
      const athleteProfile = {
        full_name: (athleteData.profiles as any).full_name,
        position: athleteData.position,
        graduation_year: athleteData.graduation_year,
        gpa: athleteData.gpa,
        sport: athleteData.sport,
      };

      // Transform the data to match PDF generator's expected format
      const pdfData = {
        profile_summary: recommendations.summary,
        top_matches: recommendations.colleges?.map((college: any, index: number) => ({
          rank: index + 1,
          school_name: college.name,
          location: college.location,
          division: college.division,
          overall_match_score: 85, // Default value since not in current data
          academic_fit_score: 80,
          athletic_fit_score: 85,
          financial_fit_score: 75,
          culture_fit_score: 90,
          why_good_fit: college.fit_reason ? [college.fit_reason] : [],
          recruiter_contact: {
            name: college.recruiter_name,
            email: college.recruiter_email,
            phone: college.recruiter_phone,
            twitter: college.recruiter_twitter,
          }
        })) || [],
        next_steps: recommendations.next_steps ? [recommendations.next_steps] : [],
        generated_at: new Date().toISOString()
      };

      // Generate the PDF
      generatePrimeDimePDF(athleteProfile, pdfData);

      toast({
        title: "Export Complete",
        description: "Your Prime Dime recommendations PDF has been downloaded",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
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
        {showAdvisor ? (
          <PrimeDimeAdvisor 
            athleteId={athleteId!} 
            onComplete={handleAdvisorComplete}
          />
        ) : !conversationCompleted ? (
          <Card className="p-16 text-center bg-card/50 backdrop-blur border-2 border-primary/20">
            <Trophy className="h-20 w-20 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-black uppercase mb-4 text-gradient-primary">Get Your Prime Dime</h2>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Let's find your perfect college match! Answer questions about your athletic abilities, academic interests, financial needs, and lifestyle preferences.
            </p>
            <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
              <div className="p-4 border rounded-lg">
                <Trophy className="h-8 w-8 text-primary mb-2 mx-auto" />
                <h3 className="font-semibold mb-1">Athletic Fit</h3>
                <p className="text-sm text-muted-foreground">
                  Match your skill level and competition goals
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <GraduationCap className="h-8 w-8 text-secondary mb-2 mx-auto" />
                <h3 className="font-semibold mb-1">Academic Programs</h3>
                <p className="text-sm text-muted-foreground">
                  Find schools with your ideal majors
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <MapPin className="h-8 w-8 text-accent mb-2 mx-auto" />
                <h3 className="font-semibold mb-1">Location & Culture</h3>
                <p className="text-sm text-muted-foreground">
                  Discover campuses where you'll thrive
                </p>
              </div>
            </div>
            <Button onClick={handleStartAdvisor} size="lg">
              Start Your Prime Dime Consultation
            </Button>
          </Card>
        ) : recommendations ? (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your College Match Profile</CardTitle>
                  <CardDescription className="mt-2">{recommendations.summary}</CardDescription>
                </div>
                <Button onClick={handleExport} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export List
                </Button>
              </CardHeader>
            </Card>

            <div>
              <h2 className="text-2xl font-bold mb-4">Your Top 10 College Recommendations</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {recommendations.colleges?.map((college: any, index: number) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">{index + 1}</Badge>
                            <CardTitle className="text-xl">{college.name}</CardTitle>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="secondary">{college.division}</Badge>
                            <Badge variant="outline">{college.location}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{college.fit_reason}</p>
                      
                      {(college.recruiter_name || college.recruiter_email || college.recruiter_phone || college.recruiter_twitter) && (
                        <div className="pt-3 border-t space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Recruiter Contact</p>
                          {college.recruiter_name && (
                            <p className="text-sm font-medium">{college.recruiter_name}</p>
                          )}
                          {college.recruiter_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              <a
                                href={`mailto:${college.recruiter_email}`}
                                className="text-sm text-primary hover:underline"
                              >
                                {college.recruiter_email}
                              </a>
                            </div>
                          )}
                          {college.recruiter_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              <a
                                href={`tel:${college.recruiter_phone}`}
                                className="text-sm text-primary hover:underline"
                              >
                                {college.recruiter_phone}
                              </a>
                            </div>
                          )}
                          {college.recruiter_twitter && (
                            <div className="flex items-center gap-2">
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                              <a
                                href={`https://twitter.com/${college.recruiter_twitter.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                {college.recruiter_twitter}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="bg-muted">
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{recommendations.next_steps}</p>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => {
                    setConversationCompleted(false);
                    setRecommendations(null);
                    setShowAdvisor(true);
                  }}>
                    Start New Consultation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : generationError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-destructive mb-4">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Generation Failed</h3>
              <p className="text-muted-foreground mb-6">
                We encountered an issue generating your recommendations. Please try again or restart the consultation.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleRetry} variant="default">
                  Retry Generation
                </Button>
                <Button onClick={handleRestart} variant="outline">
                  Restart Consultation
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                Generating your personalized recommendations...
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                This may take up to 60 seconds
              </p>
              <Button 
                onClick={() => {
                  if (athleteId) {
                    fetchRecommendations(athleteId, true);
                  }
                }}
                variant="outline"
                size="sm"
              >
                Regenerate Now
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PrimeDime;
