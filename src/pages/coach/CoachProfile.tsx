import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, Plus, ArrowLeft } from "lucide-react";

const SPORT_OPTIONS = [
  "Football",
  "Basketball", 
  "Baseball",
  "Softball",
  "Soccer",
  "Volleyball",
  "Track & Field",
  "Swimming",
  "Tennis",
  "Golf",
  "Wrestling",
  "Lacrosse"
];

export default function CoachProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    bio: "",
    specializations: [] as string[],
    certifications: "",
    experience_years: 0,
    avatar_url: null as string | null
  });
  const [newSpecialization, setNewSpecialization] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("coach_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          bio: data.bio || "",
          specializations: data.specializations || [],
          certifications: data.certifications || "",
          experience_years: data.experience_years || 0,
          avatar_url: data.avatar_url || null
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("coach_profiles")
        .update({
          full_name: profile.full_name,
          bio: profile.bio,
          specializations: profile.specializations,
          certifications: profile.certifications,
          experience_years: profile.experience_years,
          avatar_url: profile.avatar_url
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addSpecialization = () => {
    if (newSpecialization && !profile.specializations.includes(newSpecialization)) {
      setProfile({
        ...profile,
        specializations: [...profile.specializations, newSpecialization]
      });
      setNewSpecialization("");
    }
  };

  const removeSpecialization = (spec: string) => {
    setProfile({
      ...profile,
      specializations: profile.specializations.filter(s => s !== spec)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/coach/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Coach Profile</CardTitle>
            <CardDescription>
              Manage your profile and specializations to receive relevant evaluation requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <ProfilePictureUpload
              currentImageUrl={profile.avatar_url}
              onImageUpdate={(url) => setProfile({ ...profile, avatar_url: url })}
              userInitials={profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase() || "C"}
              size="md"
            />

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell athletes about your coaching background..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience_years">Years of Experience</Label>
              <Input
                id="experience_years"
                type="number"
                value={profile.experience_years}
                onChange={(e) => setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certifications">Certifications</Label>
              <Textarea
                id="certifications"
                value={profile.certifications}
                onChange={(e) => setProfile({ ...profile, certifications: e.target.value })}
                placeholder="List your coaching certifications..."
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Sport Specializations</Label>
              <p className="text-sm text-muted-foreground">
                Select sports you specialize in to receive matching evaluation requests
              </p>
              
              <div className="flex gap-2">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newSpecialization}
                  onChange={(e) => setNewSpecialization(e.target.value)}
                >
                  <option value="">Select a sport...</option>
                  {SPORT_OPTIONS.filter(sport => !profile.specializations.includes(sport)).map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
                <Button onClick={addSpecialization} disabled={!newSpecialization}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.specializations.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No specializations selected</p>
                ) : (
                  profile.specializations.map((spec) => (
                    <Badge key={spec} variant="secondary" className="pl-3 pr-1 py-1">
                      {spec}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
                        onClick={() => removeSpecialization(spec)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Profile
              </Button>
              <Button variant="outline" onClick={() => navigate("/coach/dashboard")}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
