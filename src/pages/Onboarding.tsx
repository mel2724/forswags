import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { toast } from "sonner";
import { User, Users, Trophy, Search, Shield, ChevronRight, ChevronLeft } from "lucide-react";
import { z } from "zod";

type Role = "athlete" | "parent" | "recruiter";

// Only athlete, parent, and recruiter can be self-selected
// Admin and coach roles are assigned manually by administrators
const roles = [
  { value: "athlete", label: "Athlete", icon: Trophy, description: "Student-athlete building their profile" },
  { value: "parent", label: "Parent", icon: Users, description: "Supporting my athlete's journey" },
  { value: "recruiter", label: "Recruiter", icon: Search, description: "Discovering talent for college programs" },
];

const sports = ["Football", "Basketball", "Baseball", "Softball", "Soccer", "Track & Field", "Volleyball", "Lacrosse", "Tennis", "Swimming", "Wrestling", "Golf", "Cross Country", "Other"];

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().optional(),
});

const athleteSchema = z.object({
  sport: z.string().min(1, "Sport is required"),
  position: z.string().optional(),
  height_in: z.number().min(36).max(96).optional(),
  weight_lb: z.number().min(50).max(500).optional(),
  high_school: z.string().optional(),
  graduation_year: z.number().min(2024).max(2035).optional(),
  gpa: z.number().min(0).max(5).optional(),
  sat_score: z.number().min(400).max(1600).optional(),
  act_score: z.number().min(1).max(36).optional(),
  highlights_url: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(1000).optional(),
});

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("athlete");
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  
  // Profile form data
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Athlete form data
  const [sport, setSport] = useState("");
  const [position, setPosition] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [weight, setWeight] = useState("");
  const [highSchool, setHighSchool] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [gpa, setGpa] = useState("");
  const [satScore, setSatScore] = useState("");
  const [actScore, setActScore] = useState("");
  const [highlightsUrl, setHighlightsUrl] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      
      // Pre-fill name from auth metadata
      if (session.user.user_metadata?.full_name) {
        setFullName(session.user.user_metadata.full_name);
      }
    };

    checkAuth();
  }, [navigate]);

  const totalSteps = selectedRole === "athlete" ? 6 : 1;

  const handleRoleSelect = () => {
    if (selectedRole === "athlete") {
      setStep(2);
    } else {
      handleNonAthleteComplete();
    }
  };

  const handleNonAthleteComplete = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // Check if this specific role already exists for the user
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", selectedRole)
        .maybeSingle();

      if (!existingRole) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: selectedRole as any }]);

        if (roleError) throw roleError;
      } else {
        toast.success("You already have this role assigned!");
      }

      // Check if membership already exists
      const { data: existingMembership } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingMembership) {
        const { error: membershipError } = await supabase
          .from("memberships")
          .insert([{ user_id: userId, plan: "free", status: "active" }]);

        if (membershipError) throw membershipError;
      }

      toast.success("Welcome to ForSWAGs!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Error setting up account");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 2) {
      const validation = profileSchema.safeParse({ full_name: fullName, phone });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
    }
    
    if (step === 3) {
      if (!sport) {
        toast.error("Please select a sport");
        return;
      }
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // Validate profile data
      const profileData = profileSchema.parse({ full_name: fullName, phone });

      // Calculate total height in inches
      const totalHeightInches = heightFeet && heightInches 
        ? parseInt(heightFeet) * 12 + parseInt(heightInches)
        : undefined;

      // Validate athlete data
      const athleteData = athleteSchema.parse({
        sport,
        position: position || undefined,
        height_in: totalHeightInches,
        weight_lb: weight ? parseFloat(weight) : undefined,
        high_school: highSchool || undefined,
        graduation_year: gradYear ? parseInt(gradYear) : undefined,
        gpa: gpa ? parseFloat(gpa) : undefined,
        sat_score: satScore ? parseInt(satScore) : undefined,
        act_score: actScore ? parseInt(actScore) : undefined,
        highlights_url: highlightsUrl || undefined,
        bio: bio || undefined,
      });

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          full_name: profileData.full_name,
          phone: profileData.phone 
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Insert or update athlete profile
      const { data: existingAthlete } = await supabase
        .from("athletes")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingAthlete) {
        // Update existing athlete
        const { error: athleteError } = await supabase
          .from("athletes")
          .update({
            sport: athleteData.sport,
            position: athleteData.position,
            height_in: athleteData.height_in,
            weight_lb: athleteData.weight_lb,
            high_school: athleteData.high_school,
            graduation_year: athleteData.graduation_year,
            gpa: athleteData.gpa,
            sat_score: athleteData.sat_score,
            act_score: athleteData.act_score,
            highlights_url: athleteData.highlights_url,
            bio: athleteData.bio,
          })
          .eq("user_id", userId);

        if (athleteError) throw athleteError;
      } else {
        // Insert new athlete
        const { error: athleteError } = await supabase
          .from("athletes")
          .insert([{
            user_id: userId,
            sport: athleteData.sport,
            position: athleteData.position,
            height_in: athleteData.height_in,
            weight_lb: athleteData.weight_lb,
            high_school: athleteData.high_school,
            graduation_year: athleteData.graduation_year,
            gpa: athleteData.gpa,
            sat_score: athleteData.sat_score,
            act_score: athleteData.act_score,
            highlights_url: athleteData.highlights_url,
            bio: athleteData.bio,
          }]);

        if (athleteError) throw athleteError;
      }

      // Check if athlete role already exists for the user
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "athlete")
        .maybeSingle();

      if (!existingRole) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: "athlete" as any }]);

        if (roleError) throw roleError;
      }

      // Check if membership already exists
      const { data: existingMembership } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingMembership) {
        const { error: membershipError } = await supabase
          .from("memberships")
          .insert([{ user_id: userId, plan: "free", status: "active" }]);

        if (membershipError) throw membershipError;
      }

      toast.success("Profile created! Welcome to ForSWAGs!");
      navigate("/dashboard");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Error creating profile");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background sports-pattern p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6 bg-card/80 backdrop-blur border-2 border-primary/20">
        {/* Progress indicator */}
        {selectedRole === "athlete" && step > 1 && (
          <ProgressIndicator
            steps={[
              { title: "Role", completed: true },
              { title: "Basic Info", completed: step > 2 },
              { title: "Sport Details", completed: step > 3 },
              { title: "Measurements", completed: step > 4 },
              { title: "Academics", completed: step > 5 },
              { title: "Profile", completed: step > 6 },
            ]}
            currentStep={step - 2}
            variant="steps"
          />
        )}

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black uppercase tracking-tight glow-text">Pick Your Position</h1>
              <p className="text-muted-foreground uppercase text-sm tracking-wider">How will you dominate?</p>
            </div>

            <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as Role)}>
              <div className="grid gap-4">
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <div key={role.value} className="flex items-center space-x-3">
                      <RadioGroupItem value={role.value} id={role.value} />
                      <Label
                        htmlFor={role.value}
                        className="flex items-center space-x-3 cursor-pointer flex-1 p-4 border rounded-lg hover:border-primary transition-colors"
                      >
                        <Icon className="h-6 w-6 text-primary" />
                        <div className="flex-1">
                          <div className="font-semibold">{role.label}</div>
                          <div className="text-sm text-muted-foreground">{role.description}</div>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>

            <Button onClick={handleRoleSelect} className="w-full btn-hero" disabled={loading}>
              {loading ? "Setting up..." : "Continue"}
            </Button>
          </>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black uppercase tracking-tight">Basic Info</h2>
              <p className="text-muted-foreground">Tell us about yourself</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1 btn-hero">
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Sport & Position */}
        {step === 3 && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black uppercase tracking-tight">Your Sport</h2>
              <p className="text-muted-foreground">What do you play?</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sport">Sport *</Label>
                <Select value={sport} onValueChange={setSport}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g., Quarterback, Point Guard"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1 btn-hero">
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Step 4: Physical Stats */}
        {step === 4 && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black uppercase tracking-tight">Physical Stats</h2>
              <p className="text-muted-foreground">Your measurements</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Height</Label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      placeholder="Feet"
                      min="3"
                      max="8"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      placeholder="Inches"
                      min="0"
                      max="11"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="175"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1 btn-hero">
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Step 5: Academic Info */}
        {step === 5 && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black uppercase tracking-tight">Academics</h2>
              <p className="text-muted-foreground">Your academic profile</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="highSchool">High School</Label>
                <Input
                  id="highSchool"
                  value={highSchool}
                  onChange={(e) => setHighSchool(e.target.value)}
                  placeholder="Lincoln High School"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradYear">Graduation Year</Label>
                <Input
                  id="gradYear"
                  type="number"
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  placeholder="2026"
                  min="2024"
                  max="2035"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gpa">GPA</Label>
                <Input
                  id="gpa"
                  type="number"
                  step="0.01"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                  placeholder="3.75"
                  min="0"
                  max="5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="sat">SAT Score</Label>
                  <Input
                    id="sat"
                    type="number"
                    value={satScore}
                    onChange={(e) => setSatScore(e.target.value)}
                    placeholder="1200"
                    min="400"
                    max="1600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="act">ACT Score</Label>
                  <Input
                    id="act"
                    type="number"
                    value={actScore}
                    onChange={(e) => setActScore(e.target.value)}
                    placeholder="28"
                    min="1"
                    max="36"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1 btn-hero">
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Step 6: Highlights & Bio */}
        {step === 6 && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black uppercase tracking-tight">Final Touches</h2>
              <p className="text-muted-foreground">Show your best work</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="highlights">Highlight Video URL</Label>
                <Input
                  id="highlights"
                  type="url"
                  value={highlightsUrl}
                  onChange={(e) => setHighlightsUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                />
                <p className="text-xs text-muted-foreground">YouTube, Hudl, or any video link</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself, your goals, and what makes you unique..."
                  rows={5}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">{bio.length}/1000</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleComplete} className="flex-1 btn-hero" disabled={loading}>
                {loading ? "Creating Profile..." : "Complete Setup"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default Onboarding;