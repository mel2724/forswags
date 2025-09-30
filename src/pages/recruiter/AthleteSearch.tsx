import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Save, User, MapPin, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AthleteSearch() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    position: "",
    state: "",
    grad_year_min: "",
    grad_year_max: "",
    gpa_min: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isRecruiter = roles?.some(r => r.role === "recruiter");
    if (!isRecruiter) {
      toast({
        title: "Access Denied",
        description: "You need recruiter access to search athletes",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      let query: any = supabase
        .from("athletes")
        .select("*")
        .eq("visibility", "public");

      if (filters.position) {
        query = query.eq("position", filters.position);
      }
      if (filters.state) {
        query = query.eq("state", filters.state);
      }
      if (filters.grad_year_min) {
        query = query.gte("graduation_year", parseInt(filters.grad_year_min));
      }
      if (filters.grad_year_max) {
        query = query.lte("graduation_year", parseInt(filters.grad_year_max));
      }
      if (filters.gpa_min) {
        query = query.gte("gpa", parseFloat(filters.gpa_min));
      }

      const { data, error } = await query.order("graduation_year", { ascending: true });

      if (error) throw error;
      setAthletes(data || []);
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search athletes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSearch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const searchName = `${filters.position || "All"} ${filters.state || "All States"} ${filters.grad_year_min || ""}-${filters.grad_year_max || ""}`;

      const { error } = await supabase
        .from("saved_searches")
        .insert({
          user_id: user.id,
          name: searchName.trim(),
          filters: filters,
        });

      if (error) throw error;

      toast({
        title: "Search Saved",
        description: "You can access this search from your dashboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save search",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Search Athletes</h1>
        <p className="text-muted-foreground">Find prospects that match your program's needs</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Position</Label>
              <Select value={filters.position} onValueChange={(val) => setFilters({ ...filters, position: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Positions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Positions</SelectItem>
                  <SelectItem value="QB">QB</SelectItem>
                  <SelectItem value="RB">RB</SelectItem>
                  <SelectItem value="WR">WR</SelectItem>
                  <SelectItem value="TE">TE</SelectItem>
                  <SelectItem value="OL">OL</SelectItem>
                  <SelectItem value="DL">DL</SelectItem>
                  <SelectItem value="LB">LB</SelectItem>
                  <SelectItem value="DB">DB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>State</Label>
              <Input
                placeholder="e.g., NC, SC, GA"
                value={filters.state}
                onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Min GPA</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 3.0"
                value={filters.gpa_min}
                onChange={(e) => setFilters({ ...filters, gpa_min: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Grad Year (Min)</Label>
              <Input
                type="number"
                placeholder="e.g., 2025"
                value={filters.grad_year_min}
                onChange={(e) => setFilters({ ...filters, grad_year_min: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Grad Year (Max)</Label>
              <Input
                type="number"
                placeholder="e.g., 2027"
                value={filters.grad_year_max}
                onChange={(e) => setFilters({ ...filters, grad_year_max: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              {loading ? "Searching..." : "Search"}
            </Button>
            <Button variant="outline" onClick={handleSaveSearch}>
              <Save className="w-4 h-4 mr-2" />
              Save Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {athletes.length === 0 && !loading && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No athletes found</p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Try adjusting your search filters to find prospects
              </p>
            </CardContent>
          </Card>
        )}

        {athletes.map((athlete) => (
          <Card key={athlete.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    Athlete #{athlete.id.slice(0, 8)}
                  </CardTitle>
                  <Badge variant="secondary" className="mt-1">{athlete.position}</Badge>
                </div>
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{athlete.city}, {athlete.state}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Class:</span>
                  <span className="ml-2 font-medium">{athlete.graduation_year}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">GPA:</span>
                  <span className="ml-2 font-medium">{athlete.gpa?.toFixed(1) || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Height:</span>
                  <span className="ml-2 font-medium">
                    {athlete.height_in ? `${Math.floor(athlete.height_in / 12)}'${athlete.height_in % 12}"` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Weight:</span>
                  <span className="ml-2 font-medium">{athlete.weight_lb || "N/A"} lbs</span>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{athlete.bio || "No bio available"}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
