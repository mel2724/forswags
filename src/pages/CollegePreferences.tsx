import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { z } from "zod";
import logoIcon from "@/assets/forswags-logo.png";
import { 
  ArrowLeft, School, MapPin, DollarSign, Users, 
  GraduationCap, Save, Loader2, Target, Trophy
} from "lucide-react";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const DIVISIONS = ["D1", "D2", "D3", "NAIA", "NJCAA"];

const ACADEMIC_PRIORITIES = [
  "Academic Reputation",
  "Major Programs",
  "Research Opportunities",
  "Study Abroad",
  "Honors Programs",
  "Career Services",
  "Class Size",
  "Faculty Quality"
];

const preferencesSchema = z.object({
  preferred_divisions: z.array(z.string()).min(1, "Select at least one division"),
  preferred_states: z.array(z.string()).optional(),
  max_distance_miles: z.number().min(0).max(5000).optional(),
  min_enrollment: z.number().min(0).optional(),
  max_enrollment: z.number().min(0).optional(),
  max_tuition: z.number().min(0).optional(),
  academic_priorities: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.min_enrollment && data.max_enrollment) {
    return data.min_enrollment <= data.max_enrollment;
  }
  return true;
}, {
  message: "Minimum enrollment must be less than maximum enrollment",
  path: ["max_enrollment"],
});

const CollegePreferences = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [prefsId, setPrefsId] = useState<string | null>(null);

  // Form state
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState("");
  const [minEnrollment, setMinEnrollment] = useState("");
  const [maxEnrollment, setMaxEnrollment] = useState("");
  const [maxTuition, setMaxTuition] = useState("");
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
          return;
        }

        // Get athlete profile
        const { data: athlete } = await supabase
          .from("athletes")
          .select("id")
          .eq("user_id", session.user.id)
          .single();

        if (!athlete) {
          toast.error("This feature is only available for athlete profiles");
          navigate("/dashboard");
          return;
        }

        setAthleteId(athlete.id);

        // Fetch existing preferences
        const { data: prefs, error } = await supabase
          .from("college_match_prefs")
          .select("*")
          .eq("athlete_id", athlete.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (prefs) {
          setPrefsId(prefs.id);
          setSelectedDivisions(prefs.preferred_divisions || []);
          setSelectedStates(prefs.preferred_states || []);
          setMaxDistance(prefs.max_distance_miles?.toString() || "");
          setMinEnrollment(prefs.min_enrollment?.toString() || "");
          setMaxEnrollment(prefs.max_enrollment?.toString() || "");
          setMaxTuition(prefs.max_tuition?.toString() || "");
          setSelectedPriorities(prefs.academic_priorities || []);
        }
      } catch (error: any) {
        toast.error(error.message || "Error loading preferences");
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [navigate]);

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

  const togglePriority = (priority: string) => {
    setSelectedPriorities(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const handleSave = async () => {
    if (!athleteId) return;
    setSaving(true);

    try {
      const data = preferencesSchema.parse({
        preferred_divisions: selectedDivisions,
        preferred_states: selectedStates.length > 0 ? selectedStates : undefined,
        max_distance_miles: maxDistance ? parseInt(maxDistance) : undefined,
        min_enrollment: minEnrollment ? parseInt(minEnrollment) : undefined,
        max_enrollment: maxEnrollment ? parseInt(maxEnrollment) : undefined,
        max_tuition: maxTuition ? parseFloat(maxTuition) : undefined,
        academic_priorities: selectedPriorities.length > 0 ? selectedPriorities : undefined,
      });

      if (prefsId) {
        // Update existing preferences
        const { error } = await supabase
          .from("college_match_prefs")
          .update(data)
          .eq("id", prefsId);

        if (error) throw error;
      } else {
        // Create new preferences
        const { data: newPrefs, error } = await supabase
          .from("college_match_prefs")
          .insert({
            athlete_id: athleteId,
            ...data,
          })
          .select()
          .single();

        if (error) throw error;
        setPrefsId(newPrefs.id);
      }

      toast.success("Preferences saved successfully!");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Error saving preferences");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background sports-pattern flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sports-pattern">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src={logoIcon} alt="ForSWAGs" className="h-12 cursor-pointer" onClick={() => navigate("/")} />
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-gradient-primary">College Preferences</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Find Your Perfect Match</p>
            </div>
          </div>
          
          <nav className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Target className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-black uppercase text-gradient-accent">
              Set Your Preferences
            </h2>
          </div>
          <p className="text-muted-foreground">
            Tell us what you're looking for in a college to get better matches
          </p>
        </div>

        <div className="space-y-6">
          {/* Division Preferences */}
          <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Division Preferences *
              </CardTitle>
              <CardDescription>Select the divisions you're interested in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {DIVISIONS.map((division) => (
                  <div key={division} className="flex items-center space-x-2">
                    <Checkbox
                      id={division}
                      checked={selectedDivisions.includes(division)}
                      onCheckedChange={() => toggleDivision(division)}
                    />
                    <Label
                      htmlFor={division}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {division}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedDivisions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedDivisions.map((div) => (
                    <Badge key={div} variant="secondary">
                      {div}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Preferences */}
          <Card className="bg-card/80 backdrop-blur border-2 border-secondary/20">
            <CardHeader>
              <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                <MapPin className="h-5 w-5 text-secondary" />
                Location Preferences
              </CardTitle>
              <CardDescription>Where do you want to go to school?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Preferred States (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Select specific states or leave empty for all states
                </p>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {US_STATES.map((state) => (
                    <div
                      key={state}
                      onClick={() => toggleState(state)}
                      className={`
                        p-2 text-center text-sm font-medium rounded-md border-2 cursor-pointer transition-all
                        ${selectedStates.includes(state)
                          ? 'bg-secondary text-black border-secondary'
                          : 'border-border hover:border-secondary/50'
                        }
                      `}
                    >
                      {state}
                    </div>
                  ))}
                </div>
                {selectedStates.length > 0 && (
                  <div className="mt-4 p-3 bg-secondary/10 rounded-lg">
                    <p className="text-sm font-medium mb-2">Selected States ({selectedStates.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedStates.map((state) => (
                        <Badge key={state} variant="secondary">
                          {state}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="maxDistance">Maximum Distance from Home (miles)</Label>
                <Input
                  id="maxDistance"
                  type="number"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(e.target.value)}
                  placeholder="e.g., 500"
                  min="0"
                  max="5000"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty if distance doesn't matter
                </p>
              </div>
            </CardContent>
          </Card>

          {/* School Size Preferences */}
          <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                School Size
              </CardTitle>
              <CardDescription>What size school are you looking for?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minEnrollment">Minimum Enrollment</Label>
                  <Input
                    id="minEnrollment"
                    type="number"
                    value={minEnrollment}
                    onChange={(e) => setMinEnrollment(e.target.value)}
                    placeholder="e.g., 1000"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxEnrollment">Maximum Enrollment</Label>
                  <Input
                    id="maxEnrollment"
                    type="number"
                    value={maxEnrollment}
                    onChange={(e) => setMaxEnrollment(e.target.value)}
                    placeholder="e.g., 20000"
                    min="0"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Leave empty if school size doesn't matter
              </p>
            </CardContent>
          </Card>

          {/* Financial Preferences */}
          <Card className="bg-card/80 backdrop-blur border-2 border-secondary/20">
            <CardHeader>
              <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-secondary" />
                Financial Considerations
              </CardTitle>
              <CardDescription>Set your budget preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="maxTuition">Maximum Annual Tuition</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="maxTuition"
                    type="number"
                    value={maxTuition}
                    onChange={(e) => setMaxTuition(e.target.value)}
                    placeholder="e.g., 50000"
                    min="0"
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty if cost is not a primary concern
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Academic Priorities */}
          <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Academic Priorities
              </CardTitle>
              <CardDescription>What matters most to you academically?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {ACADEMIC_PRIORITIES.map((priority) => (
                  <div key={priority} className="flex items-center space-x-2">
                    <Checkbox
                      id={priority}
                      checked={selectedPriorities.includes(priority)}
                      onCheckedChange={() => togglePriority(priority)}
                    />
                    <Label
                      htmlFor={priority}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {priority}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedPriorities.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedPriorities.map((priority) => (
                    <Badge key={priority} variant="outline" className="text-primary border-primary">
                      {priority}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="btn-accent"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CollegePreferences;