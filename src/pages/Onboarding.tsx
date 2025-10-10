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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { User, Users, Trophy, Search, Shield, ChevronRight, ChevronLeft, Zap, Sparkles } from "lucide-react";
import { z } from "zod";
import { InteractiveTutorial } from "@/components/InteractiveTutorial";
import { VideoWalkthroughModal, VideoWalkthroughButton } from "@/components/VideoWalkthroughModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";

type Role = "athlete" | "parent" | "recruiter";

// Only athlete, parent, and recruiter can be self-selected
// Admin and coach roles are assigned manually by administrators
const roles = [
  { value: "athlete", label: "Athlete", icon: Trophy, description: "Student-athlete building their profile" },
  { value: "parent", label: "Parent", icon: Users, description: "Supporting my athlete's journey" },
  { value: "recruiter", label: "College Scout", icon: Search, description: "Discovering talent for college programs" },
];

const sports = ["Football", "Basketball", "Baseball", "Softball", "Soccer", "Track & Field", "Volleyball", "Lacrosse", "Tennis", "Swimming", "Wrestling", "Golf", "Cross Country", "Other"];

// Sample data for demo mode
const SAMPLE_DATA = {
  fullName: "Jordan Taylor",
  phone: "(555) 234-5678",
  sport: "Basketball",
  position: "Point Guard",
  heightFeet: "6",
  heightInches: "2",
  weight: "185",
  highSchool: "Lincoln High School",
  gradYear: "2026",
  gpa: "3.8",
  satScore: "1280",
  actScore: "28",
  highlightsUrl: "https://youtube.com/watch?v=example",
  bio: "Passionate athlete with strong leadership skills and dedication to both academics and athletics. Team captain for 2 years with proven track record in competitive play.",
};

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
  const [setupMode, setSetupMode] = useState<"quick" | "complete">("quick");
  const [useSampleData, setUseSampleData] = useState(false);
  const [tutorialEnabled, setTutorialEnabled] = useState(true);
  
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
  const [hudlProfileUrl, setHudlProfileUrl] = useState("");
  const [maxprepsProfileUrl, setMaxprepsProfileUrl] = useState("");
  const [publicProfileConsent, setPublicProfileConsent] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isParentConsenting, setIsParentConsenting] = useState(false);
  const [parentEmail, setParentEmail] = useState("");
  const [parentEmailVerified, setParentEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  // Calculate age from date of birth
  const calculateAge = (dob: string): number | null => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = dateOfBirth ? calculateAge(dateOfBirth) : null;
  const isUnder13 = age !== null && age < 13;

  // Load sample data function
  const loadSampleData = () => {
    setFullName(SAMPLE_DATA.fullName);
    setPhone(SAMPLE_DATA.phone);
    setSport(SAMPLE_DATA.sport);
    setPosition(SAMPLE_DATA.position);
    setHeightFeet(SAMPLE_DATA.heightFeet);
    setHeightInches(SAMPLE_DATA.heightInches);
    setWeight(SAMPLE_DATA.weight);
    setHighSchool(SAMPLE_DATA.highSchool);
    setGradYear(SAMPLE_DATA.gradYear);
    setGpa(SAMPLE_DATA.gpa);
    setSatScore(SAMPLE_DATA.satScore);
    setActScore(SAMPLE_DATA.actScore);
    setHighlightsUrl(SAMPLE_DATA.highlightsUrl);
    setBio(SAMPLE_DATA.bio);
    setUseSampleData(true);
    toast.success("Sample data loaded! Feel free to customize it.");
  };

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

  const totalSteps = selectedRole === "athlete" ? (setupMode === "quick" ? 4 : 6) : 1;

  const handleRoleSelect = () => {
    if (selectedRole === "athlete") {
      setStep(2);
    } else {
      handleNonAthleteComplete();
    }
  };

  const sendParentVerification = async () => {
    if (!parentEmail) {
      toast.error("Please enter parent email address");
      return;
    }

    setSendingVerification(true);
    try {
      const { error } = await supabase.functions.invoke('send-parent-verification', {
        body: {
          parent_email: parentEmail,
          child_name: fullName,
          child_dob: dateOfBirth,
        }
      });

      if (error) throw error;

      setShowVerificationInput(true);
      toast.success("Verification code sent to parent email");
    } catch (error) {
      console.error("Error sending verification:", error);
      toast.error("Failed to send verification email");
    } finally {
      setSendingVerification(false);
    }
  };

  const verifyParentCode = async () => {
    if (!verificationCode) {
      toast.error("Please enter verification code");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('verify-parent-code', {
        body: {
          parent_email: parentEmail,
          verification_code: verificationCode,
        }
      });

      if (error) throw error;

      if (data?.valid) {
        setParentEmailVerified(true);
        toast.success("Parent email verified successfully");
      } else {
        toast.error("Invalid or expired verification code");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      toast.error("Failed to verify code");
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
      
      // In quick mode, skip from step 3 to final step (step 4 in quick mode = step 6 in complete mode)
      if (setupMode === "quick") {
        setStep(6); // Jump to final consent step
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

      // Capture consent IP address (client-side approximation)
      let consentIpAddress: string | null = null;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        consentIpAddress = ipData.ip;
      } catch (e) {
        console.warn('Could not fetch IP address for consent tracking');
      }

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
            public_profile_consent: publicProfileConsent,
            date_of_birth: dateOfBirth || null,
            consent_timestamp: publicProfileConsent && isParentConsenting ? new Date().toISOString() : null,
            consent_ip_address: publicProfileConsent && isParentConsenting ? consentIpAddress : null,
            is_parent_verified: isUnder13 ? parentEmailVerified : isParentConsenting,
            parent_email: isUnder13 ? parentEmail : null,
            parent_verified_at: parentEmailVerified ? new Date().toISOString() : null,
            consent_expires_at: isUnder13 && parentEmailVerified 
              ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString() 
              : null,
            hudl_profile_url: hudlProfileUrl || null,
            maxpreps_profile_url: maxprepsProfileUrl || null,
          })
          .eq("user_id", userId);

        if (athleteError) throw athleteError;
        
        // Create stat update reminder for this athlete
        const { data: currentAthlete } = await supabase
          .from("athletes")
          .select("id")
          .eq("user_id", userId)
          .single();
        
        if (currentAthlete) {
          // Check if reminder already exists
          const { data: existingReminder } = await supabase
            .from("stat_update_reminders")
            .select("id")
            .eq("athlete_id", currentAthlete.id)
            .maybeSingle();
          
          if (!existingReminder) {
            await supabase
              .from("stat_update_reminders")
              .insert([{ athlete_id: currentAthlete.id }]);
          }
        }
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
            public_profile_consent: publicProfileConsent,
            date_of_birth: dateOfBirth || null,
            consent_timestamp: publicProfileConsent && isParentConsenting ? new Date().toISOString() : null,
            consent_ip_address: publicProfileConsent && isParentConsenting ? consentIpAddress : null,
            is_parent_verified: isParentConsenting,
            hudl_profile_url: hudlProfileUrl || null,
            maxpreps_profile_url: maxprepsProfileUrl || null,
          }]);

        if (athleteError) throw athleteError;
        
        // Get the newly created athlete ID and create stat update reminder
        const { data: newAthlete } = await supabase
          .from("athletes")
          .select("id")
          .eq("user_id", userId)
          .single();
        
        if (newAthlete) {
          await supabase
            .from("stat_update_reminders")
            .insert([{ athlete_id: newAthlete.id }]);
        }
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
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center bg-background sports-pattern p-4">
        {userId && selectedRole === 'athlete' && step > 1 && (
          <ErrorBoundary fallback={null}>
            <InteractiveTutorial 
              currentOnboardingStep={step}
              onComplete={() => setTutorialEnabled(false)}
              enabled={tutorialEnabled}
            />
            <VideoWalkthroughModal />
          </ErrorBoundary>
        )}
        
        <Card className="w-full max-w-2xl p-8 space-y-6 bg-card/80 backdrop-blur border-2 border-primary/20">
        {/* Sample Data Toggle */}
        {selectedRole === "athlete" && step > 1 && step < 6 && !useSampleData && (
          <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg border border-accent/20">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium">Try with sample data</span>
            </div>
            <Button onClick={loadSampleData} variant="outline" size="sm">
              Load Demo
            </Button>
          </div>
        )}

        {/* Progress indicator */}
        {selectedRole === "athlete" && step > 1 && (
          <ProgressIndicator
            steps={
              setupMode === "quick"
                ? [
                    { title: "Role", completed: true },
                    { title: "Basic Info", completed: step > 2 },
                    { title: "Sport", completed: step > 3 },
                    { title: "Consent", completed: step > 6 },
                  ]
                : [
                    { title: "Role", completed: true },
                    { title: "Basic Info", completed: step > 2 },
                    { title: "Sport Details", completed: step > 3 },
                    { title: "Measurements", completed: step > 4 },
                    { title: "Academics", completed: step > 5 },
                    { title: "Profile", completed: step > 6 },
                  ]
            }
            currentStep={setupMode === "quick" ? Math.min(step - 1, 3) : step - 2}
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
              <div className="grid gap-4" data-tutorial="role-selection">
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

            {/* Setup Mode Selection (only for athletes) */}
            {selectedRole === "athlete" && (
              <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
                <Label className="text-sm font-semibold">Setup Mode</Label>
                <RadioGroup value={setupMode} onValueChange={(value) => setSetupMode(value as "quick" | "complete")}>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="quick" id="quick" />
                      <Label htmlFor="quick" className="cursor-pointer flex items-center gap-2">
                        <Zap className="h-4 w-4 text-accent" />
                        <div>
                          <div className="font-medium">Quick Setup (5 min)</div>
                          <div className="text-xs text-muted-foreground">Just the essentials, complete profile later</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="complete" id="complete" />
                      <Label htmlFor="complete" className="cursor-pointer flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-medium">Complete Setup (10 min)</div>
                          <div className="text-xs text-muted-foreground">Full profile with all details</div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}

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
              {userId && <VideoWalkthroughButton videoId="profile-basics" />}
            </div>

            <div className="space-y-4" data-tutorial="basic-info-form">
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
              <p className="text-muted-foreground">
                {setupMode === "quick" ? "What do you play? (You can add more details later)" : "What do you play?"}
              </p>
              {userId && <VideoWalkthroughButton videoId="sport-profile" />}
            </div>

            <div className="space-y-4" data-tutorial="sport-selection">
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
                <Label htmlFor="position">Position {setupMode === "quick" && "(Optional)"}</Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g., Quarterback, Point Guard"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hudlUrl">Hudl Profile URL (Optional)</Label>
                <Input
                  id="hudlUrl"
                  type="url"
                  value={hudlProfileUrl}
                  onChange={(e) => setHudlProfileUrl(e.target.value)}
                  placeholder="https://www.hudl.com/profile/..."
                />
                <p className="text-xs text-muted-foreground">We'll remind you to sync your stats from Hudl</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxprepsUrl">MaxPreps Profile URL (Optional)</Label>
                <Input
                  id="maxprepsUrl"
                  type="url"
                  value={maxprepsProfileUrl}
                  onChange={(e) => setMaxprepsProfileUrl(e.target.value)}
                  placeholder="https://www.maxpreps.com/athlete/..."
                />
                <p className="text-xs text-muted-foreground">We'll remind you to sync your stats from MaxPreps</p>
              </div>

              {setupMode === "quick" && (
                <div className="p-3 bg-accent/10 rounded-md border border-accent/20">
                  <p className="text-xs text-muted-foreground">
                    ⚡ Quick Setup: You can add measurements, academics, and more details in your profile later!
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1 btn-hero">
                {setupMode === "quick" ? "Almost Done" : "Next"}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Step 4: Physical Stats (Complete mode only) */}
        {step === 4 && setupMode === "complete" && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black uppercase tracking-tight">Physical Stats</h2>
              <p className="text-muted-foreground">Your measurements</p>
              {userId && <VideoWalkthroughButton videoId="physical-stats" />}
            </div>

            <div className="space-y-4" data-tutorial="measurements-form">
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

        {/* Step 5: Academic Info (Complete mode only) */}
        {step === 5 && setupMode === "complete" && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black uppercase tracking-tight">Academics</h2>
              <p className="text-muted-foreground">Your academic profile</p>
              {userId && <VideoWalkthroughButton videoId="academics-guide" />}
            </div>

            <div className="space-y-4" data-tutorial="academics-form">
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
              {userId && <VideoWalkthroughButton videoId="profile-completion" />}
            </div>

            <div className="space-y-4" data-tutorial="highlights-form">
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

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">Required for COPPA compliance</p>
              </div>

              {/* Public Profile Consent */}
              <div className="space-y-4 p-6 bg-muted/50 rounded-lg border-2 border-primary/20">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="public-consent"
                    checked={publicProfileConsent}
                    onChange={(e) => setPublicProfileConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <div className="space-y-2">
                    <label
                      htmlFor="public-consent"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I consent to making my athletic profile publicly searchable
                    </label>
                    <p className="text-sm text-muted-foreground">
                      By checking this box, you agree to make your profile searchable by college recruiters with active memberships. 
                      Your profile will be accessible via a public link, but only paid recruiters can search for you. 
                      Contact information (email/phone) will never be publicly displayed - recruiters must connect through our platform.
                    </p>
                  </div>
                </div>

                {/* Parent/Guardian Consent for Minors */}
                {dateOfBirth && age !== null && age < 18 && publicProfileConsent && (
                  <div className="pt-4 border-t border-border space-y-4">
                    {isUnder13 ? (
                      <div className="space-y-4 p-4 border border-primary rounded-lg bg-muted/50">
                        <h3 className="font-semibold text-primary">Parent Email Verification Required</h3>
                        <div>
                          <Label htmlFor="parentEmail">Parent/Guardian Email Address *</Label>
                          <Input
                            id="parentEmail"
                            type="email"
                            value={parentEmail}
                            onChange={(e) => setParentEmail(e.target.value)}
                            placeholder="parent@example.com"
                            disabled={parentEmailVerified}
                            required
                          />
                        </div>
                        {!parentEmailVerified && !showVerificationInput && (
                          <Button 
                            onClick={sendParentVerification} 
                            disabled={!parentEmail || sendingVerification}
                            className="w-full"
                          >
                            {sendingVerification ? "Sending..." : "Send Verification Code"}
                          </Button>
                        )}
                        {showVerificationInput && !parentEmailVerified && (
                          <div>
                            <Label htmlFor="verificationCode">Verification Code</Label>
                            <Input
                              id="verificationCode"
                              type="text"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              placeholder="Enter 6-digit code"
                              maxLength={6}
                            />
                            <Button onClick={verifyParentCode} className="w-full mt-2">
                              Verify Code
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                              Code expires in 24 hours. Check parent email for verification code.
                            </p>
                          </div>
                        )}
                        {parentEmailVerified && (
                          <div className="flex items-center space-x-2 text-green-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Parent Email Verified</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="parent-consent"
                          checked={isParentConsenting}
                          onChange={(e) => setIsParentConsenting(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-gray-300"
                        />
                        <div className="space-y-2">
                          <label
                            htmlFor="parent-consent"
                            className="text-sm font-medium leading-none"
                          >
                            Parent/Guardian Consent (Required for ages 13-17)
                          </label>
                          <p className="text-sm text-muted-foreground">
                            As a parent or legal guardian, I consent to my child's athletic profile being made publicly searchable by college recruiters. 
                            I understand that contact information will not be publicly displayed and recruiters must connect through the platform.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleComplete} 
                className="flex-1 btn-hero" 
                disabled={loading || (isUnder13 && publicProfileConsent && !parentEmailVerified) || (age !== null && age >= 13 && age < 18 && publicProfileConsent && !isParentConsenting)}
              >
                {loading ? "Creating Profile..." : "Complete Setup"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
    </ErrorBoundary>
  );
};

export default Onboarding;