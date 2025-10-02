import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import { ProfileActions } from "@/components/ProfileActions";
import { toast } from "sonner";
import { z } from "zod";
import logoIcon from "@/assets/forswags-logo.png";
import { 
  User, Trophy, GraduationCap, Video, ArrowLeft, Save, 
  Loader2, LogOut, Ruler, Weight 
} from "lucide-react";

const sports = [
  "Football", "Basketball", "Baseball", "Softball", "Soccer", 
  "Track & Field", "Volleyball", "Lacrosse", "Tennis", 
  "Swimming", "Wrestling", "Golf", "Cross Country", "Other"
];

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

const athleteSchema = z.object({
  sport: z.string().min(1, "Sport is required"),
  secondary_sports: z.array(z.string()).optional(),
  position: z.string().optional(),
  height_in: z.number().min(36).max(96).optional(),
  weight_lb: z.number().min(50).max(500).optional(),
  high_school: z.string().optional(),
  club_team_name: z.string().optional(),
  graduation_year: z.number().min(2024).max(2035).optional(),
  jersey_number: z.string().optional(),
  filled_out_by: z.string().optional(),
  nickname: z.string().optional(),
  gpa: z.number().min(0).max(5).optional(),
  sat_score: z.number().min(400).max(1600).optional(),
  act_score: z.number().min(1).max(36).optional(),
  ncaa_eligibility_number: z.string().optional(),
  academic_achievements: z.string().optional(),
  favorite_subject: z.string().optional(),
  has_honors_ap_ib: z.boolean().optional(),
  honors_courses: z.string().optional(),
  legal_situations: z.boolean().optional(),
  legal_situations_explanation: z.string().optional(),
  forty_yard_dash: z.number().optional(),
  vertical_jump: z.number().optional(),
  bench_press_max: z.number().optional(),
  squat_max: z.number().optional(),
  athletic_awards: z.array(z.string()).optional(),
  leadership_roles: z.string().optional(),
  notable_performances: z.string().optional(),
  being_recruited: z.boolean().optional(),
  recruiting_schools: z.array(z.string()).optional(),
  received_offers: z.boolean().optional(),
  offer_schools: z.array(z.string()).optional(),
  committed: z.boolean().optional(),
  committed_school: z.string().optional(),
  camps_attended: z.array(z.string()).optional(),
  upcoming_camps: z.array(z.string()).optional(),
  twitter_handle: z.string().optional(),
  instagram_handle: z.string().optional(),
  tiktok_handle: z.string().optional(),
  personal_description: z.string().optional(),
  five_year_goals: z.string().optional(),
  motivation: z.string().optional(),
  challenges_overcome: z.string().optional(),
  role_model: z.string().optional(),
  community_involvement: z.string().optional(),
  message_to_coaches: z.string().optional(),
  highlights_url: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(1000).optional(),
});

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [athleteId, setAthleteId] = useState<string | null>(null);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Athlete fields
  const [username, setUsername] = useState("");
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
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email || "");

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileData) {
        setFullName(profileData.full_name || "");
        setPhone(profileData.phone || "");
        setAvatarUrl(profileData.avatar_url || null);
      }

      // Load athlete data
      const { data: athleteData } = await supabase
        .from("athletes")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (athleteData) {
        setAthleteId(athleteData.id);
        setUsername(athleteData.username || "");
        setSport(athleteData.sport || "");
        setPosition(athleteData.position || "");
        setWeight(athleteData.weight_lb?.toString() || "");
        setHighSchool(athleteData.high_school || "");
        setGradYear(athleteData.graduation_year?.toString() || "");
        setGpa(athleteData.gpa?.toString() || "");
        setSatScore(athleteData.sat_score?.toString() || "");
        setActScore(athleteData.act_score?.toString() || "");
        setHighlightsUrl(athleteData.highlights_url || "");
        setBio(athleteData.bio || "");

        // Convert height from total inches to feet and inches
        if (athleteData.height_in) {
          const feet = Math.floor(athleteData.height_in / 12);
          const inches = athleteData.height_in % 12;
          setHeightFeet(feet.toString());
          setHeightInches(inches.toString());
        }
      }

      setLoading(false);
    };

    loadProfile();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);

    try {
      // Validate profile data
      const profileData = profileSchema.parse({ 
        full_name: fullName, 
        phone: phone || undefined 
      });

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
          phone: profileData.phone,
          avatar_url: avatarUrl
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Validate and format username
      const formattedUsername = username
        ? username.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
        : undefined;

      // Update athlete profile
      const { error: athleteError } = await supabase
        .from("athletes")
        .update({
          username: formattedUsername,
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
        .eq("id", athleteId);

      if (athleteError) throw athleteError;

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Error updating profile");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sports-pattern">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
              <img src={logoIcon} alt="ForSWAGs" className="h-12" />
            </div>
            <Separator orientation="vertical" className="h-8" />
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-primary hover:text-primary/80 font-bold">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>

          <Button variant="ghost" onClick={handleSignOut} className="text-primary hover:text-primary/80 font-bold">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-2 uppercase tracking-tight">
            Edit Profile
          </h1>
          <p className="text-muted-foreground">
            Keep your information up to date to get the best college matches
          </p>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>Your basic contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Profile Username *</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="john-smith"
                />
                <p className="text-xs text-muted-foreground">
                  Your public profile URL: forswags.com/athlete/{username || 'your-username'}
                </p>
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

              <ProfilePictureUpload
                currentImageUrl={avatarUrl}
                onImageUpdate={setAvatarUrl}
                userInitials={fullName.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
                size="md"
              />
            </CardContent>
          </Card>

          {/* Athletic Information */}
          <Card className="bg-card/80 backdrop-blur border-2 border-secondary/20">
            <CardHeader>
              <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                <Trophy className="h-5 w-5 text-secondary" />
                Athletic Information
              </CardTitle>
              <CardDescription>Your sport and position details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
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

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Height
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      placeholder="Feet"
                      min="3"
                      max="8"
                    />
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

                <div className="space-y-2">
                  <Label htmlFor="weight" className="flex items-center gap-2">
                    <Weight className="h-4 w-4" />
                    Weight (lbs)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="175"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Academic Information
              </CardTitle>
              <CardDescription>Your education and test scores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
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

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
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
            </CardContent>
          </Card>

          {/* Media & Bio */}
          <Card className="bg-card/80 backdrop-blur border-2 border-secondary/20">
            <CardHeader>
              <CardTitle className="uppercase tracking-tight flex items-center gap-2">
                <Video className="h-5 w-5 text-secondary" />
                Highlights & Bio
              </CardTitle>
              <CardDescription>Showcase your best work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="highlights">Highlight Video URL</Label>
                <Input
                  id="highlights"
                  type="url"
                  value={highlightsUrl}
                  onChange={(e) => setHighlightsUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  YouTube, Hudl, or any video link
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself, your goals, and what makes you unique..."
                  rows={6}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {bio.length}/1000
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Sharing Actions */}
          {athleteId && (
            <ProfileActions 
              athleteId={athleteId}
              athleteName={fullName}
              athleteUsername={username}
            />
          )}

          {/* Save Button */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 btn-hero"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
