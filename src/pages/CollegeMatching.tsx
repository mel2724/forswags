import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollegeMatchCard } from "@/components/CollegeMatchCard";
import { Loader2, RefreshCw, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TierFeatureGuard } from "@/components/TierFeatureGuard";

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [savedMatches, setSavedMatches] = useState<any[]>([]);

  useEffect(() => {
    fetchAthleteAndMatches();
  }, []);

  const fetchAthleteAndMatches = async () => {
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

      // Fetch matches
      await fetchMatches(athlete.id);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load college matches",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMatches = async (athleteId: string) => {
    const { data, error } = await supabase
      .from('college_matches')
      .select(`
        *,
        schools (*)
      `)
      .eq('athlete_id', athleteId)
      .order('match_score', { ascending: false });

    if (error) throw error;

    setMatches(data || []);
    setSavedMatches(data?.filter(m => m.is_saved) || []);
  };

  const handleAnalyzeMatches = async () => {
    if (!athleteId) return;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-college-match', {
        body: { athleteId }
      });

      if (error) throw error;

      toast({
        title: "Analysis Complete",
        description: data.message,
      });

      await fetchMatches(athleteId);
    } catch (error: any) {
      console.error('Error analyzing matches:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze college matches",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
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
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">College Matching</h1>
          <p className="text-muted-foreground">
            AI-powered recommendations based on your academic and athletic profile
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/college-preferences')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </Button>
          <Button
            onClick={handleAnalyzeMatches}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Analyze Matches
              </>
            )}
          </Button>
        </div>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Matches Yet</CardTitle>
            <CardDescription>
              Click "Analyze Matches" to get AI-powered college recommendations based on your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAnalyzeMatches} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Start Analysis'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              All Matches ({matches.length})
            </TabsTrigger>
            <TabsTrigger value="saved">
              Saved ({savedMatches.length})
            </TabsTrigger>
            <TabsTrigger value="top">
              Top Matches
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {matches.map((match) => (
                <CollegeMatchCard
                  key={match.id}
                  match={match}
                  onSaveToggle={() => fetchMatches(athleteId!)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            {savedMatches.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No saved colleges yet. Click the heart icon on any match to save it.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {savedMatches.map((match) => (
                  <CollegeMatchCard
                    key={match.id}
                    match={match}
                    onSaveToggle={() => fetchMatches(athleteId!)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="top" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {matches
                .filter(m => m.match_score >= 80)
                .map((match) => (
                  <CollegeMatchCard
                    key={match.id}
                    match={match}
                    onSaveToggle={() => fetchMatches(athleteId!)}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
