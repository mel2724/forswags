import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoIcon from "@/assets/forswags-logo.png";
import { 
  Search, Trophy, MapPin, Calendar, GraduationCap, 
  Ruler, Weight, BarChart3, Video, Filter 
} from "lucide-react";

interface Athlete {
  id: string;
  user_id: string;
  sport: string;
  position: string | null;
  high_school: string | null;
  graduation_year: number | null;
  height_inches: number | null;
  weight_lbs: number | null;
  gpa: number | null;
  sat_score: number | null;
  act_score: number | null;
  highlights_url: string | null;
  bio: string | null;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const Players = () => {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [gradYearFilter, setGradYearFilter] = useState<string>("all");

  useEffect(() => {
    loadAthletes();
  }, []);

  useEffect(() => {
    filterAthletes();
  }, [searchTerm, sportFilter, gradYearFilter, athletes]);

  const loadAthletes = async () => {
    try {
      const { data: athletesData, error: athletesError } = await supabase
        .from("athletes")
        .select("*")
        .order("created_at", { ascending: false });

      if (athletesError) throw athletesError;

      // Fetch profiles separately
      const userIds = athletesData?.map(a => a.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Merge athletes with profiles
      const athletesWithProfiles = athletesData?.map(athlete => ({
        ...athlete,
        profiles: profilesData?.find(p => p.id === athlete.user_id) || null
      }));

      setAthletes(athletesWithProfiles || []);
    } catch (error: any) {
      toast.error("Failed to load athletes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterAthletes = () => {
    let filtered = [...athletes];

    if (searchTerm) {
      filtered = filtered.filter(athlete => 
        athlete.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.sport?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.high_school?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sportFilter !== "all") {
      filtered = filtered.filter(athlete => athlete.sport === sportFilter);
    }

    if (gradYearFilter !== "all") {
      filtered = filtered.filter(athlete => athlete.graduation_year?.toString() === gradYearFilter);
    }

    setFilteredAthletes(filtered);
  };

  const uniqueSports = Array.from(new Set(athletes.map(a => a.sport))).sort();
  const uniqueGradYears = Array.from(new Set(athletes.map(a => a.graduation_year).filter(Boolean))).sort((a, b) => b! - a!);

  const formatHeight = (inches: number | null) => {
    if (!inches) return "N/A";
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading athletes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sports-pattern">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoIcon} alt="ForSWAGs" className="h-12" />
          </div>
          
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-primary hover:text-primary/80 font-bold">
              Dashboard
            </Button>
            <Button onClick={() => navigate("/auth")} className="btn-hero">
              Sign Up
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-5xl font-black mb-3 uppercase tracking-tight">
            Athlete Directory
          </h1>
          <p className="text-muted-foreground uppercase text-sm tracking-wider">
            Discover the next generation of champions • {filteredAthletes.length} Athletes
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 bg-card/80 backdrop-blur border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, sport, position, or school..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={sportFilter} onValueChange={setSportFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {uniqueSports.map(sport => (
                    <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={gradYearFilter} onValueChange={setGradYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Graduation Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {uniqueGradYears.map(year => (
                    <SelectItem key={year} value={year!.toString()}>Class of {year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Athletes Grid */}
        {filteredAthletes.length === 0 ? (
          <Card className="p-16 text-center bg-card/50 backdrop-blur border-2 border-primary/20">
            <Trophy className="h-20 w-20 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-black uppercase mb-4">No Athletes Found</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Try adjusting your search or filters to find athletes
            </p>
            <Button onClick={() => {
              setSearchTerm("");
              setSportFilter("all");
              setGradYearFilter("all");
            }}>
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAthletes.map((athlete) => (
              <Card 
                key={athlete.id}
                className="bg-card/80 backdrop-blur border-2 border-primary/20 hover:border-primary transition-all cursor-pointer group overflow-hidden"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      {athlete.profiles?.avatar_url ? (
                        <img 
                          src={athlete.profiles.avatar_url} 
                          alt={athlete.profiles.full_name || "Athlete"}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <Trophy className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg uppercase tracking-tight truncate">
                        {athlete.profiles?.full_name || "Athlete"}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="uppercase font-bold text-xs">
                          {athlete.sport}
                        </Badge>
                        {athlete.position && (
                          <span className="text-xs text-muted-foreground">{athlete.position}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Key Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {athlete.graduation_year && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">Class of {athlete.graduation_year}</span>
                      </div>
                    )}
                    {athlete.high_school && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs truncate">{athlete.high_school}</span>
                      </div>
                    )}
                    {athlete.height_inches && (
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">{formatHeight(athlete.height_inches)}</span>
                      </div>
                    )}
                    {athlete.weight_lbs && (
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">{athlete.weight_lbs} lbs</span>
                      </div>
                    )}
                    {athlete.gpa && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">GPA: {athlete.gpa.toFixed(2)}</span>
                      </div>
                    )}
                    {(athlete.sat_score || athlete.act_score) && (
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">
                          {athlete.sat_score ? `SAT: ${athlete.sat_score}` : `ACT: ${athlete.act_score}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bio Preview */}
                  {athlete.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {athlete.bio}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/profile/${athlete.id}`)}
                    >
                      View Profile
                    </Button>
                    {athlete.highlights_url && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(athlete.highlights_url!, "_blank");
                        }}
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Players;