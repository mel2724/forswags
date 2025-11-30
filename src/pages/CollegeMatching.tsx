import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trophy, MapPin, GraduationCap, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TierFeatureGuard } from "@/components/TierFeatureGuard";
import { PrimeDimeAdvisor } from "@/components/PrimeDimeAdvisor";
import { Badge } from "@/components/ui/badge";

export default function CollegeMatching() {
  return (
    <TierFeatureGuard featureKey="college_matching">
      <CollegeMatchingPage />
    </TierFeatureGuard>
  );
}

function CollegeMatchingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [conversationCompleted, setConversationCompleted] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);

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

      if (athleteError) throw athleteError;
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
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load \"Prime Dime\" data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendations = async (athleteId: string) => {
    const { data, error } = await supabase
      .from('college_recommendations')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching recommendations:', error);
      return;
    }

    if (data) {
      setRecommendations(data.recommendations);
    }
  };

  const handleStartAdvisor = () => {
    setShowAdvisor(true);
  };

  const handleAdvisorComplete = async () => {
    setShowAdvisor(false);
    setConversationCompleted(true);
    if (athleteId) {
      await fetchRecommendations(athleteId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">The "Prime Dime"</h1>
        <p className="text-muted-foreground">
          Personalized college recommendations based on your unique profile and goals
        </p>
      </div>

      {showAdvisor ? (
        <PrimeDimeAdvisor 
          athleteId={athleteId!} 
          onComplete={handleAdvisorComplete}
        />
      ) : !conversationCompleted ? (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to The "Prime Dime"</CardTitle>
            <CardDescription>
              Let's find your perfect college match! I'll ask you some questions about your athletic abilities, academic interests, financial needs, and lifestyle preferences to recommend the best colleges for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <Trophy className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">Athletic Fit</h3>
                  <p className="text-sm text-muted-foreground">
                    Match your skill level and competition goals
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <GraduationCap className="h-8 w-8 text-secondary mb-2" />
                  <h3 className="font-semibold mb-1">Academic Programs</h3>
                  <p className="text-sm text-muted-foreground">
                    Find schools with your ideal majors and support
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <MapPin className="h-8 w-8 text-accent mb-2" />
                  <h3 className="font-semibold mb-1">Location & Culture</h3>
                  <p className="text-sm text-muted-foreground">
                    Discover campuses where you'll thrive
                  </p>
                </div>
              </div>
              <Button onClick={handleStartAdvisor} size="lg" className="w-full">
                Start Your "Prime Dime" Consultation
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : recommendations ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your College Match Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{recommendations.summary}</p>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-4">Your Top 10 College Recommendations</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {recommendations.colleges?.map((college: any, index: number) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{college.name}</CardTitle>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">{college.division}</Badge>
                          <Badge variant="outline">{college.location}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{college.fit_reason}</p>
                    {college.recruiter_twitter && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <ExternalLink className="h-4 w-4 text-primary" />
                        <a
                          href={`https://twitter.com/${college.recruiter_twitter.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          Contact Recruiter {college.recruiter_twitter}
                        </a>
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
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              Generating your personalized recommendations...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
