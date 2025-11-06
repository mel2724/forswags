import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import logoIcon from "@/assets/forswags-logo.png";
import { Trophy, Medal, Crown, TrendingUp, MapPin, Target } from "lucide-react";
import { TierFeatureGuard } from "@/components/TierFeatureGuard";

export default function Rankings() {
  return <RankingsPage />;
}

function RankingsPage() {
  interface RankingData {
    id: string;
    athlete_id: string | null;
    external_athlete_name?: string | null;
    is_external_only: boolean;
    sport: string;
    graduation_year: number | null;
    overall_rank: number | null;
    position_rank: number | null;
    state_rank: number | null;
    national_rank: number | null;
    composite_score: number | null;
    last_calculated: string;
    athletes?: {
      sport: string;
      position: string | null;
      graduation_year: number | null;
      high_school: string | null;
      city?: string | null;
      state?: string | null;
      user_id: string;
      committed_school_id?: string | null;
      commitment_date?: string | null;
      commitment_status?: string | null;
    } | null;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  }

  const navigate = useNavigate();
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [gradYearFilter, setGradYearFilter] = useState<string>("all");
  const [committedSchools, setCommittedSchools] = useState<Record<string, { name: string; logo_url: string }>>({});

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      const { data: rankingsData, error: rankingsError } = await supabase
        .from("rankings")
        .select("*, athletes(*)")
        .order("sport", { ascending: true })
        .order("overall_rank", { ascending: true, nullsFirst: false });

      if (rankingsError) throw rankingsError;

      // Fetch profiles separately for internal athletes
      const userIds = rankingsData?.map(r => r.athletes?.user_id).filter(Boolean) || [];
      let profilesData: any[] = [];
      if (userIds.length > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);
        profilesData = data || [];
      }

      // Merge rankings with profiles
      const rankingsWithProfiles = rankingsData?.map(ranking => ({
        ...ranking,
        profiles: ranking.athlete_id 
          ? profilesData?.find(p => p.id === ranking.athletes?.user_id) || null
          : null
      }));

      setRankings(rankingsWithProfiles || []);

      // Load committed schools
      const uniqueSchoolIds = [...new Set(
        rankingsData
          ?.map(r => r.athletes?.committed_school_id)
          .filter(Boolean)
      )] as string[];

      if (uniqueSchoolIds.length > 0) {
        const { data: schools } = await supabase
          .from('schools')
          .select('id, name, logo_url')
          .in('id', uniqueSchoolIds);

        const schoolsMap: Record<string, { name: string; logo_url: string }> = {};
        schools?.forEach(school => {
          schoolsMap[school.id] = {
            name: school.name,
            logo_url: school.logo_url || ''
          };
        });
        setCommittedSchools(schoolsMap);
      }
    } catch (error: any) {
      toast.error("Failed to load rankings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRankings = rankings.filter(ranking => {
    const sport = ranking.sport || ranking.athletes?.sport;
    const gradYear = ranking.graduation_year || ranking.athletes?.graduation_year;
    
    if (sportFilter !== "all" && sport !== sportFilter) return false;
    if (gradYearFilter !== "all" && gradYear?.toString() !== gradYearFilter) return false;
    return true;
  });

  const uniqueSports = Array.from(new Set(rankings.map(r => r.sport || r.athletes?.sport).filter(Boolean)));
  const uniqueGradYears = Array.from(new Set(rankings.map(r => r.graduation_year || r.athletes?.graduation_year).filter(Boolean))).sort((a, b) => b! - a!);

  const getRankIcon = (rank: number | null) => {
    if (!rank) return null;
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <Trophy className="h-5 w-5 text-muted-foreground" />;
  };

  const getRankBadgeVariant = (rank: number | null) => {
    if (!rank) return "outline";
    if (rank === 1) return "default";
    if (rank <= 3) return "secondary";
    return "outline";
  };

  const RankingCard = ({ ranking, rankType, rankValue }: { ranking: RankingData; rankType: string; rankValue: number | null }) => {
    const athleteName = ranking.is_external_only 
      ? ranking.external_athlete_name 
      : ranking.profiles?.full_name;
    const sport = ranking.sport || ranking.athletes?.sport;
    const position = ranking.athletes?.position;
    const gradYear = ranking.graduation_year || ranking.athletes?.graduation_year;

    return (
      <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary transition-colors">
        <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
          {getRankIcon(rankValue)}
        </div>
        
        <div className="flex-shrink-0">
          <Badge variant={getRankBadgeVariant(rankValue)} className="text-lg font-black px-3 py-1">
            #{rankValue || "N/A"}
          </Badge>
        </div>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {!ranking.is_external_only && ranking.profiles?.avatar_url ? (
              <img 
                src={ranking.profiles.avatar_url} 
                alt={athleteName || "Athlete"}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <Trophy className="h-5 w-5 text-primary" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold truncate">{athleteName || "Unknown Athlete"}</h4>
              {ranking.is_external_only && (
                <Badge variant="outline" className="text-xs">External</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span>{sport}</span>
              {position && (
                <>
                  <span>•</span>
                  <span>{position}</span>
                </>
              )}
              {gradYear && (
                <>
                  <span>•</span>
                  <span>Class of {gradYear}</span>
                </>
              )}
              {!ranking.is_external_only && ranking.athletes?.committed_school_id && committedSchools[ranking.athletes.committed_school_id] && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    {committedSchools[ranking.athletes.committed_school_id].logo_url && (
                      <img 
                        src={committedSchools[ranking.athletes.committed_school_id].logo_url}
                        alt={committedSchools[ranking.athletes.committed_school_id].name}
                        className="h-4 w-4 rounded-full object-cover"
                      />
                    )}
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {committedSchools[ranking.athletes.committed_school_id].name}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {ranking.composite_score && (
          <div className="text-right">
            <div className="text-xl font-black text-primary">
              {ranking.composite_score.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Score</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading rankings...</p>
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
            <Button variant="ghost" onClick={() => navigate("/players")} className="text-primary hover:text-primary/80 font-bold">
              Athletes
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-5xl font-black mb-3 uppercase tracking-tight flex items-center gap-3">
            <Trophy className="h-12 w-12 text-primary" />
            Rankings
          </h1>
          <p className="text-muted-foreground uppercase text-sm tracking-wider">
            Top performers ranked by our algorithm • {filteredRankings.length} Athletes
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8 bg-card/80 backdrop-blur border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Select value={sportFilter} onValueChange={setSportFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {uniqueSports.map(sport => (
                    <SelectItem key={sport} value={sport!}>{sport}</SelectItem>
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

        {/* Rankings Tabs */}
        <Tabs defaultValue="overall" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="overall" className="uppercase font-bold">
              Overall
            </TabsTrigger>
            <TabsTrigger value="position" className="uppercase font-bold">
              Position
            </TabsTrigger>
            <TabsTrigger value="state" className="uppercase font-bold">
              State
            </TabsTrigger>
            <TabsTrigger value="national" className="uppercase font-bold">
              National
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="space-y-4">
            <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Overall Rankings
                </CardTitle>
                <CardDescription>Athletes ranked by composite performance score</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredRankings.filter(r => r.overall_rank).length > 0 ? (
                  filteredRankings
                    .filter(r => r.overall_rank)
                    .sort((a, b) => (a.overall_rank || 999) - (b.overall_rank || 999))
                    .map(ranking => (
                      <RankingCard key={ranking.id} ranking={ranking} rankType="Overall" rankValue={ranking.overall_rank} />
                    ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No rankings available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="position" className="space-y-4">
            <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Position Rankings
                </CardTitle>
                <CardDescription>Athletes ranked within their position group</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredRankings.filter(r => r.position_rank).length > 0 ? (
                  filteredRankings
                    .filter(r => r.position_rank)
                    .sort((a, b) => (a.position_rank || 999) - (b.position_rank || 999))
                    .map(ranking => (
                      <RankingCard key={ranking.id} ranking={ranking} rankType="Position" rankValue={ranking.position_rank} />
                    ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No position rankings available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="state" className="space-y-4">
            <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  State Rankings
                </CardTitle>
                <CardDescription>Top athletes within their state</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredRankings.filter(r => r.state_rank).length > 0 ? (
                  filteredRankings
                    .filter(r => r.state_rank)
                    .sort((a, b) => (a.state_rank || 999) - (b.state_rank || 999))
                    .map(ranking => (
                      <RankingCard key={ranking.id} ranking={ranking} rankType="State" rankValue={ranking.state_rank} />
                    ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No state rankings available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="national" className="space-y-4">
            <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  National Rankings
                </CardTitle>
                <CardDescription>Elite athletes ranked nationally</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredRankings.filter(r => r.national_rank).length > 0 ? (
                  filteredRankings
                    .filter(r => r.national_rank)
                    .sort((a, b) => (a.national_rank || 999) - (b.national_rank || 999))
                    .map(ranking => (
                      <RankingCard key={ranking.id} ranking={ranking} rankType="National" rankValue={ranking.national_rank} />
                    ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No national rankings available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
