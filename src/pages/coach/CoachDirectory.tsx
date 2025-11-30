import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Users, Star, Award, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoIcon from "@/assets/forswags-logo.png";

interface Coach {
  id: string;
  user_id: string;
  full_name: string;
  bio: string | null;
  specializations: string[] | null;
  experience_years: number | null;
  avatar_url: string | null;
  evaluation_count?: number;
  average_rating?: number;
}

export default function CoachDirectory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sportFilter, setSportFilter] = useState("all");

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    try {
      const { data: coachesData, error } = await supabase
        .from("coach_profiles")
        .select("*")
        .eq("is_active", true)
        .order("experience_years", { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Get evaluation stats for each coach
      const coachesWithStats = await Promise.all(
        (coachesData || []).map(async (coach) => {
          const { data: evaluations } = await supabase
            .from("evaluations")
            .select("status, rating")
            .eq("coach_id", coach.user_id);

          const completed = evaluations?.filter(e => e.status === "completed") || [];
          const ratings = completed.map(e => e.rating).filter(r => r !== null) as number[];
          const avgRating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            : undefined;

          return {
            ...coach,
            evaluation_count: evaluations?.length || 0,
            average_rating: avgRating
          };
        })
      );

      setCoaches(coachesWithStats);
    } catch (error: any) {
      console.error("Error loading coaches:", error);
      toast({
        title: "Error",
        description: "Failed to load coaches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = coach.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = sportFilter === "all" || 
      (coach.specializations && coach.specializations.some(s => s === sportFilter));
    return matchesSearch && matchesSport;
  });

  const allSports = Array.from(
    new Set(coaches.flatMap(c => c.specializations || []))
  ).sort();

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoIcon} alt="ForSWAGs" className="h-12" />
          </div>
          
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-primary hover:text-primary/80 font-bold">
              Dashboard
            </Button>
            <Button variant="ghost" onClick={() => navigate("/evaluations")} className="text-primary hover:text-primary/80 font-bold">
              Get Evaluated
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">Coach Directory</h1>
          </div>
          <p className="text-muted-foreground">
            Meet our expert coaches who will evaluate your performance
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search coaches by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={sportFilter} onValueChange={setSportFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {allSports.map(sport => (
                    <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Coaches Grid */}
        {filteredCoaches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No coaches found</p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoaches.map((coach) => (
              <Card key={coach.id} className="hover:border-primary transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary">
                      <AvatarImage src={coach.avatar_url || undefined} alt={coach.full_name} />
                      <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                        {getInitials(coach.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{coach.full_name}</CardTitle>
                      <CardDescription className="text-xs">
                        {coach.experience_years ? `${coach.experience_years} years experience` : "Expert Coach"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Award className="h-3 w-3" />
                      {coach.evaluation_count || 0} evals
                    </div>
                    {coach.average_rating && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {coach.average_rating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Bio Preview */}
                  {coach.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {coach.bio}
                    </p>
                  )}

                  {/* Specializations */}
                  {coach.specializations && coach.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {coach.specializations.slice(0, 3).map((spec, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                      {coach.specializations.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{coach.specializations.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <Button 
                    className="w-full mt-2"
                    onClick={() => navigate(`/coach/view/${coach.id}`)}
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
