import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, MapPin, Users, DollarSign, BookOpen, Trophy, Heart } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CollegeMatchCardProps {
  match: {
    id: string;
    school_id: string;
    match_score: number;
    academic_fit: number;
    athletic_fit: number;
    financial_fit: number;
    is_saved: boolean;
    notes: string;
    schools: {
      name: string;
      city: string;
      state: string;
      division: string;
      enrollment: number;
      tuition: number;
      logo_url?: string;
    };
  };
  onSaveToggle?: () => void;
}

export function CollegeMatchCard({ match, onSaveToggle }: CollegeMatchCardProps) {
  const [isSaved, setIsSaved] = useState(match.is_saved);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const notes = match.notes ? JSON.parse(match.notes) : {};
  const { summary, strengths, considerations, culture_fit } = notes;

  const handleSaveToggle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('college_matches')
        .update({ is_saved: !isSaved })
        .eq('id', match.id);

      if (error) throw error;

      setIsSaved(!isSaved);
      toast({
        title: isSaved ? "Removed from saved" : "Saved to favorites",
        description: `${match.schools.name} has been ${isSaved ? 'removed from' : 'added to'} your saved colleges.`,
      });
      onSaveToggle?.();
    } catch (error) {
      console.error('Error toggling save:', error);
      toast({
        title: "Error",
        description: "Failed to update saved status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Fair";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl">{match.schools.name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4" />
              {match.schools.city}, {match.schools.state}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{match.schools.division}</Badge>
            <Button
              variant={isSaved ? "default" : "outline"}
              size="icon"
              onClick={handleSaveToggle}
              disabled={isLoading}
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Match</span>
            <span className={`text-2xl font-bold ${getScoreColor(match.match_score)}`}>
              {Math.round(match.match_score)}%
            </span>
          </div>
          <Progress value={match.match_score} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">{getScoreLabel(match.match_score)} Match</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fit Scores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4" />
              <span>Academic Fit</span>
            </div>
            <Progress value={match.academic_fit} className="h-2" />
            <p className="text-xs text-muted-foreground">{Math.round(match.academic_fit)}%</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4" />
              <span>Athletic Fit</span>
            </div>
            <Progress value={match.athletic_fit} className="h-2" />
            <p className="text-xs text-muted-foreground">{Math.round(match.athletic_fit)}%</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              <span>Financial Fit</span>
            </div>
            <Progress value={match.financial_fit} className="h-2" />
            <p className="text-xs text-muted-foreground">{Math.round(match.financial_fit)}%</p>
          </div>
          
          {culture_fit && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4" />
                <span>Culture Fit</span>
              </div>
              <Progress value={culture_fit} className="h-2" />
              <p className="text-xs text-muted-foreground">{Math.round(culture_fit)}%</p>
            </div>
          )}
        </div>

        {/* School Info */}
        <div className="flex gap-4 text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{match.schools.enrollment?.toLocaleString()} students</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>${match.schools.tuition?.toLocaleString()}/yr</span>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">{summary}</p>
          </div>
        )}

        {/* Strengths */}
        {strengths && strengths.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Key Strengths</h4>
            <ul className="space-y-1">
              {strengths.map((strength: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Considerations */}
        {considerations && considerations.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Considerations</h4>
            <ul className="space-y-1">
              {considerations.map((consideration: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-yellow-600">⚠</span>
                  <span>{consideration}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button className="w-full" variant="outline">
          View Full Profile
        </Button>
      </CardContent>
    </Card>
  );
}
