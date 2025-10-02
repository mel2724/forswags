import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlumniCard } from "@/components/AlumniCard";
import { Loader2, Search, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AlumniNetwork() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [alumni, setAlumni] = useState<any[]>([]);
  const [filteredAlumni, setFilteredAlumni] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [savedSchools, setSavedSchools] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAlumni();
  }, [searchQuery, sportFilter, schoolFilter, alumni]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Get athlete profile
      const { data: athlete, error: athleteError } = await supabase
        .from('athletes')
        .select('id, sport')
        .eq('user_id', user.id)
        .single();

      if (athleteError) throw athleteError;
      setAthleteId(athlete.id);

      // Get saved schools from college matches
      const { data: matches } = await supabase
        .from('college_matches')
        .select(`
          school_id,
          schools (
            id,
            name
          )
        `)
        .eq('athlete_id', athlete.id)
        .eq('is_saved', true);

      setSavedSchools(matches?.map(m => m.schools) || []);

      // Fetch alumni - prioritize same sport and saved schools
      const { data: alumniData, error: alumniError } = await supabase
        .from('alumni')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          ),
          schools:school_id (
            name
          )
        `)
        .order('graduation_year', { ascending: false });

      if (alumniError) throw alumniError;

      setAlumni(alumniData || []);
      setFilteredAlumni(alumniData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load alumni network",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAlumni = () => {
    let filtered = [...alumni];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.profiles?.full_name?.toLowerCase().includes(query) ||
        a.schools?.name?.toLowerCase().includes(query) ||
        a.sport?.toLowerCase().includes(query) ||
        a.company?.toLowerCase().includes(query) ||
        a.professional_role?.toLowerCase().includes(query)
      );
    }

    // Sport filter
    if (sportFilter !== "all") {
      filtered = filtered.filter(a => a.sport === sportFilter);
    }

    // School filter
    if (schoolFilter !== "all") {
      filtered = filtered.filter(a => a.school_id === schoolFilter);
    }

    setFilteredAlumni(filtered);
  };

  const uniqueSports = [...new Set(alumni.map(a => a.sport))].sort();

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
        <h1 className="text-3xl font-bold mb-2">Alumni Network</h1>
        <p className="text-muted-foreground">
          Connect with alumni from your target schools to learn about their experiences
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, school, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sportFilter} onValueChange={setSportFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {uniqueSports.map(sport => (
                  <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by school" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {savedSchools.length > 0 && (
                  <>
                    <SelectItem disabled value="saved">My Saved Schools:</SelectItem>
                    {savedSchools.map(school => (
                      <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alumni Grid */}
      {filteredAlumni.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {searchQuery || sportFilter !== "all" || schoolFilter !== "all"
                ? "No alumni found matching your filters."
                : "No alumni in the network yet. Check back soon!"}
            </p>
            {(searchQuery || sportFilter !== "all" || schoolFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSportFilter("all");
                  setSchoolFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredAlumni.length} {filteredAlumni.length === 1 ? 'alumni' : 'alumni members'}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAlumni.map((alumnus) => (
              <AlumniCard
                key={alumnus.id}
                alumni={alumnus}
                athleteId={athleteId || undefined}
                onConnect={fetchData}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
