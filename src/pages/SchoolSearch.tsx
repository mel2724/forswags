import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, GraduationCap, MapPin, DollarSign, Users, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface School {
  id: string;
  name: string;
  location_city: string | null;
  location_state: string | null;
  division: string | null;
  conference: string | null;
  enrollment: number | null;
  tuition: number | null;
  avg_gpa: number | null;
  avg_sat: number | null;
  acceptance_rate: number | null;
  website_url: string | null;
  athletic_website_url: string | null;
}

export default function SchoolSearch() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [conferenceFilter, setConferenceFilter] = useState("all");

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .order("name");

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error("Error loading schools:", error);
      toast.error("Failed to load schools");
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = schools.filter((school) => {
    const matchesSearch = 
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.location_city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.location_state?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDivision = divisionFilter === "all" || school.division === divisionFilter;
    const matchesState = stateFilter === "all" || school.location_state === stateFilter;
    const matchesConference = conferenceFilter === "all" || school.conference === conferenceFilter;

    return matchesSearch && matchesDivision && matchesState && matchesConference;
  });

  const uniqueDivisions = Array.from(new Set(schools.map(s => s.division).filter(Boolean))).sort();
  const uniqueStates = Array.from(new Set(schools.map(s => s.location_state).filter(Boolean))).sort();
  const uniqueConferences = Array.from(new Set(schools.map(s => s.conference).filter(Boolean))).sort();

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  const formatNumber = (num: number | null) => {
    if (!num) return "N/A";
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading schools...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <GraduationCap className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">School Search</h1>
          </div>
          <p className="text-muted-foreground">
            Explore colleges and universities • {filteredSchools.length} schools found
          </p>
        </div>

        {/* Advanced Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
            <CardDescription>Find the perfect school for your athletic career</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by school name, city, or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {uniqueDivisions.map(div => (
                    <SelectItem key={div} value={div!}>{div}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {uniqueStates.map(state => (
                    <SelectItem key={state} value={state!}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={conferenceFilter} onValueChange={setConferenceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Conference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conferences</SelectItem>
                  {uniqueConferences.map(conf => (
                    <SelectItem key={conf} value={conf!}>{conf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(searchQuery || divisionFilter !== "all" || stateFilter !== "all" || conferenceFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setDivisionFilter("all");
                  setStateFilter("all");
                  setConferenceFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Schools Grid */}
        {filteredSchools.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No schools found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchools.map((school) => (
              <Card key={school.id} className="hover:border-primary transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">{school.name}</CardTitle>
                    {school.division && (
                      <Badge variant="secondary" className="shrink-0">{school.division}</Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {school.location_city}, {school.location_state}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {school.conference && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Conference:</span>{" "}
                      <span className="font-medium">{school.conference}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Enrollment
                      </div>
                      <div className="font-medium">{formatNumber(school.enrollment)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Tuition
                      </div>
                      <div className="font-medium">{formatCurrency(school.tuition)}</div>
                    </div>
                  </div>

                  {(school.avg_gpa || school.avg_sat || school.acceptance_rate) && (
                    <div className="border-t pt-3 space-y-1 text-xs">
                      {school.avg_gpa && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg GPA:</span>
                          <span className="font-medium">{school.avg_gpa.toFixed(2)}</span>
                        </div>
                      )}
                      {school.avg_sat && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg SAT:</span>
                          <span className="font-medium">{school.avg_sat}</span>
                        </div>
                      )}
                      {school.acceptance_rate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Acceptance:</span>
                          <span className="font-medium">{(school.acceptance_rate * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {school.website_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(school.website_url!, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Website
                      </Button>
                    )}
                    {school.athletic_website_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(school.athletic_website_url!, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Athletics
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
