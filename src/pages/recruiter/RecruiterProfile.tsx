import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RecruiterProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [formData, setFormData] = useState({
    school_name: "",
    division: "",
    title: "",
    sport: "",
    primary_positions: [] as string[],
    states_focus: [] as string[],
    notes: "",
  });
  const [newPosition, setNewPosition] = useState("");
  const [newState, setNewState] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

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

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isRecruiter = roles?.some(r => r.role === "recruiter");
      if (!isRecruiter) {
        toast({
          title: "Access Denied",
          description: "You need college scout access",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      const { data: profileData } = await supabase
        .from("recruiter_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Also get user profile for avatar
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("id", user.id)
        .single();

      if (userProfile) {
        setAvatarUrl(userProfile.avatar_url);
        setFullName(userProfile.full_name || "");
      }

      if (profileData) {
        setProfile(profileData);
        setFormData({
          school_name: profileData.school_name || "",
          division: profileData.division || "",
          title: profileData.title || "",
          sport: profileData.sport || "",
          primary_positions: profileData.primary_positions || [],
          states_focus: profileData.states_focus || [],
          notes: profileData.notes || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update user profile avatar
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      if (profileError) throw profileError;

      if (profile) {
        const { error } = await supabase
          .from("recruiter_profiles")
          .update(formData)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("recruiter_profiles")
          .insert({
            ...formData,
            user_id: user.id,
          });

        if (error) throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Your recruiter profile has been saved",
      });
      fetchProfile();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addPosition = () => {
    if (newPosition && !formData.primary_positions.includes(newPosition)) {
      setFormData({
        ...formData,
        primary_positions: [...formData.primary_positions, newPosition],
      });
      setNewPosition("");
    }
  };

  const removePosition = (position: string) => {
    setFormData({
      ...formData,
      primary_positions: formData.primary_positions.filter(p => p !== position),
    });
  };

  const addState = () => {
    if (newState && !formData.states_focus.includes(newState.toUpperCase())) {
      setFormData({
        ...formData,
        states_focus: [...formData.states_focus, newState.toUpperCase()],
      });
      setNewState("");
    }
  };

  const removeState = (state: string) => {
    setFormData({
      ...formData,
      states_focus: formData.states_focus.filter(s => s !== state),
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">College Scout Profile</h1>
        <p className="text-muted-foreground">Manage your scouting preferences and school information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
          <CardDescription>Tell athletes about your program</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProfilePictureUpload
            currentImageUrl={avatarUrl}
            onImageUpdate={setAvatarUrl}
            userInitials={fullName.split(" ").map(n => n[0]).join("").toUpperCase() || "R"}
            size="md"
          />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>School Name *</Label>
              <Input
                value={formData.school_name}
                onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                placeholder="e.g., University of North Carolina"
              />
            </div>

            <div className="space-y-2">
              <Label>Division</Label>
              <Select value={formData.division} onValueChange={(val) => setFormData({ ...formData, division: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="D1">Division I</SelectItem>
                  <SelectItem value="D2">Division II</SelectItem>
                  <SelectItem value="D3">Division III</SelectItem>
                  <SelectItem value="JUCO">JUCO</SelectItem>
                  <SelectItem value="NAIA">NAIA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Your Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Head Coach, Recruiting Coordinator"
              />
            </div>

            <div className="space-y-2">
              <Label>Sport *</Label>
              <Select value={formData.sport} onValueChange={(val) => setFormData({ ...formData, sport: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Football">Football</SelectItem>
                  <SelectItem value="Basketball">Basketball</SelectItem>
                  <SelectItem value="Baseball">Baseball</SelectItem>
                  <SelectItem value="Softball">Softball</SelectItem>
                  <SelectItem value="Soccer">Soccer</SelectItem>
                  <SelectItem value="Track & Field">Track & Field</SelectItem>
                  <SelectItem value="Volleyball">Volleyball</SelectItem>
                  <SelectItem value="Swimming">Swimming</SelectItem>
                  <SelectItem value="Tennis">Tennis</SelectItem>
                  <SelectItem value="Golf">Golf</SelectItem>
                  <SelectItem value="Wrestling">Wrestling</SelectItem>
                  <SelectItem value="Lacrosse">Lacrosse</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scouting Preferences</CardTitle>
          <CardDescription>What positions and regions do you scout?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Primary Positions</Label>
            <div className="flex gap-2">
              <Select value={newPosition} onValueChange={setNewPosition}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Add position" />
                </SelectTrigger>
                <SelectContent>
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
              <Button onClick={addPosition} variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.primary_positions.map((pos) => (
                <Badge key={pos} variant="secondary" className="cursor-pointer" onClick={() => removePosition(pos)}>
                  {pos}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>States of Focus</Label>
            <div className="flex gap-2">
              <Input
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                placeholder="e.g., NC"
                maxLength={2}
                className="flex-1"
              />
              <Button onClick={addState} variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.states_focus.map((state) => (
                <Badge key={state} variant="secondary" className="cursor-pointer" onClick={() => removeState(state)}>
                  {state}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g., Looking for strong academics, leadership qualities..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving || !formData.school_name || !formData.sport}>
          {saving ? "Saving..." : "Save Profile"}
        </Button>
        <Button variant="outline" onClick={() => navigate("/recruiter/dashboard")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
