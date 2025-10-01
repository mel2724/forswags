import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Award, Briefcase, Star, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CoachProfile {
  id: string;
  user_id: string;
  full_name: string;
  bio: string | null;
  specializations: string[] | null;
  certifications: string | null;
  experience_years: number | null;
  avatar_url: string | null;
  is_active: boolean;
}

interface EvaluationStats {
  total_evaluations: number;
  completed_evaluations: number;
  average_rating: number | null;
}

export default function CoachProfileView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [stats, setStats] = useState<EvaluationStats>({
    total_evaluations: 0,
    completed_evaluations: 0,
    average_rating: null
  });

  useEffect(() => {
    if (id) {
      loadCoachProfile();
    }
  }, [id]);

  const loadCoachProfile = async () => {
    try {
      // Get coach profile
      const { data: profileData, error: profileError } = await supabase
        .from("coach_profiles")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);

      // Get evaluation stats
      const { data: evaluations, error: evalError } = await supabase
        .from("evaluations")
        .select("status, rating")
        .eq("coach_id", profileData.user_id);

      if (evalError) {
        console.error("Error fetching stats:", evalError);
      } else {
        const completed = evaluations?.filter(e => e.status === "completed") || [];
        const ratings = completed.map(e => e.rating).filter(r => r !== null) as number[];
        const avgRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
          : null;

        setStats({
          total_evaluations: evaluations?.length || 0,
          completed_evaluations: completed.length,
          average_rating: avgRating
        });
      }
    } catch (error: any) {
      console.error("Error loading coach profile:", error);
      toast({
        title: "Error",
        description: "Failed to load coach profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Coach profile not found</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="h-24 w-24 border-4 border-primary">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                  {profile.is_active && (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Active Coach
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {profile.experience_years && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {profile.experience_years} years experience
                    </div>
                  )}
                  {stats.completed_evaluations > 0 && (
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      {stats.completed_evaluations} evaluations completed
                    </div>
                  )}
                  {stats.average_rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {stats.average_rating.toFixed(1)} average rating
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Evaluations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_evaluations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.completed_evaluations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center gap-2">
                {stats.average_rating ? stats.average_rating.toFixed(1) : "N/A"}
                {stats.average_rating && (
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bio */}
        {profile.bio && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Specializations */}
        {profile.specializations && profile.specializations.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sport Specializations</CardTitle>
              <CardDescription>
                Sports and positions this coach specializes in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.specializations.map((spec, index) => (
                  <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                    {spec}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certifications */}
        {profile.certifications && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications & Qualifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {profile.certifications}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
