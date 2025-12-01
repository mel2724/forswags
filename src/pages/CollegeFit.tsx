import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Filter, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface School {
  id: string;
  name: string;
  division: string;
  conference: string;
  location_city: string;
  location_state: string;
  school_size: string;
  min_gpa: number;
  roster_needs: string;
  coach_name: string;
  coach_email: string;
  website_url: string;
}

type FilterPreset = {
  name: string;
  divisions?: string[];
  conferences?: string[];
};

const PRESETS: FilterPreset[] = [
  {
    name: "HBCU Focus",
    divisions: ["D1-FCS", "D2"],
    conferences: ["MEAC", "CIAA", "SIAC"]
  },
  {
    name: "JUCO Bridge",
    divisions: ["JUCO"]
  }
];

export default function CollegeFit() {
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const { toast } = useToast();

  // Filter states
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [positionSearch, setPositionSearch] = useState("");
  const [minGpa, setMinGpa] = useState([2.5]);

  // Derived options
  const [availableDivisions, setAvailableDivisions] = useState<string[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [schools, selectedDivisions, selectedStates, positionSearch, minGpa]);

  const loadSchools = async () => {
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, division, conference, location_city, location_state, school_size, min_gpa, roster_needs, coach_name, coach_email, website_url")
        .order("name", { ascending: true });

      if (error) throw error;

      setSchools(data || []);

      // Extract unique divisions and states
      const divisions = [...new Set((data || []).map(s => s.division).filter(Boolean))];
      setAvailableDivisions(divisions);

      const states = [...new Set((data || []).map(s => s.location_state).filter(Boolean))] as string[];
      setAvailableStates(states.sort());

    } catch (error: any) {
      toast({
        title: "Error loading schools",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...schools];

    // Division filter
    if (selectedDivisions.length > 0) {
      filtered = filtered.filter(s => selectedDivisions.includes(s.division));
    }

    // State filter
    if (selectedStates.length > 0) {
      filtered = filtered.filter(s => selectedStates.includes(s.location_state));
    }

    // Position search
    if (positionSearch.trim()) {
      filtered = filtered.filter(s => 
        s.roster_needs?.toLowerCase().includes(positionSearch.toLowerCase())
      );
    }

    // Min GPA filter
    filtered = filtered.filter(s => !s.min_gpa || s.min_gpa <= minGpa[0]);

    setFilteredSchools(filtered);
  };

  const applyPreset = (preset: FilterPreset) => {
    if (preset.divisions) {
      setSelectedDivisions(preset.divisions);
    }
    if (preset.conferences) {
      // For conference-based presets, filter schools by conference
      const schoolsInConferences = schools.filter(s => 
        preset.conferences?.includes(s.conference)
      );
      const divisionsInPreset = [...new Set(schoolsInConferences.map(s => s.division).filter(Boolean))];
      setSelectedDivisions(divisionsInPreset);
    }
    setSelectedStates([]);
    setPositionSearch("");
    setMinGpa([2.5]);
  };

  const clearFilters = () => {
    setSelectedDivisions([]);
    setSelectedStates([]);
    setPositionSearch("");
    setMinGpa([2.5]);
  };

  const toggleDivision = (division: string) => {
    setSelectedDivisions(prev => 
      prev.includes(division) 
        ? prev.filter(d => d !== division)
        : [...prev, division]
    );
  };

  const toggleState = (state: string) => {
    setSelectedStates(prev => 
      prev.includes(state) 
        ? prev.filter(s => s !== state)
        : [...prev, state]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Find Colleges by Fit</h1>
          <p className="text-muted-foreground mt-2">
            Filter and explore colleges based on your preferences
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setFiltersVisible(!filtersVisible)}
        >
          <Filter className="h-4 w-4 mr-2" />
          {filtersVisible ? "Hide" : "Show"} Filters
        </Button>
      </div>

      {filtersVisible && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Refine your college search</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Presets */}
            <div>
              <Label className="mb-2 block">Quick Presets</Label>
              <div className="flex gap-2">
                {PRESETS.map(preset => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.name}
                  </Button>
                ))}
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>

            {/* Division Filter */}
            <div>
              <Label className="mb-2 block">Division</Label>
              <div className="flex flex-wrap gap-3">
                {availableDivisions.map(division => (
                  <div key={division} className="flex items-center space-x-2">
                    <Checkbox
                      id={`div-${division}`}
                      checked={selectedDivisions.includes(division)}
                      onCheckedChange={() => toggleDivision(division)}
                    />
                    <label
                      htmlFor={`div-${division}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {division}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* State Filter */}
            <div>
              <Label className="mb-2 block">State</Label>
              <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto">
                {availableStates.map(state => (
                  <div key={state} className="flex items-center space-x-2">
                    <Checkbox
                      id={`state-${state}`}
                      checked={selectedStates.includes(state)}
                      onCheckedChange={() => toggleState(state)}
                    />
                    <label
                      htmlFor={`state-${state}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {state}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Position Search */}
            <div>
              <Label htmlFor="position">Position (search roster needs)</Label>
              <Input
                id="position"
                placeholder="e.g., QB, RB, WR..."
                value={positionSearch}
                onChange={(e) => setPositionSearch(e.target.value)}
              />
            </div>

            {/* GPA Slider */}
            <div>
              <Label htmlFor="gpa">Minimum GPA: {minGpa[0].toFixed(1)}</Label>
              <Slider
                id="gpa"
                min={2.0}
                max={4.0}
                step={0.1}
                value={minGpa}
                onValueChange={setMinGpa}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Results ({filteredSchools.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Conference</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Min GPA</TableHead>
                  <TableHead>Roster Needs</TableHead>
                  <TableHead>Coach Name</TableHead>
                  <TableHead>Coach Email</TableHead>
                  <TableHead>Website</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchools.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No colleges match your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchools.map(school => (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">{school.name}</TableCell>
                      <TableCell>{school.division || "—"}</TableCell>
                      <TableCell>{school.conference || "—"}</TableCell>
                      <TableCell>{school.location_city && school.location_state ? `${school.location_city}, ${school.location_state}` : "—"}</TableCell>
                      <TableCell>{school.school_size || "—"}</TableCell>
                      <TableCell>{school.min_gpa ? school.min_gpa.toFixed(1) : "—"}</TableCell>
                      <TableCell className="max-w-xs truncate">{school.roster_needs || "—"}</TableCell>
                      <TableCell>{school.coach_name || "—"}</TableCell>
                      <TableCell>
                        {school.coach_email ? (
                          <a href={`mailto:${school.coach_email}`} className="text-primary hover:underline">
                            {school.coach_email}
                          </a>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {school.website_url ? (
                          <a href={school.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Visit
                          </a>
                        ) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
