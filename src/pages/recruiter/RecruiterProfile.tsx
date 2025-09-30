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
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RecruiterProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    school_name: "",
    division: "",
    title: "",
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
          description: "You need recruiter access",
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

      if (profileData) {
        setProfile(profileData);
        setFormData({
          school_name: profileData.school_name || "",
          division: profileData.division || "",
          title: profileData.title || "",
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
        <h1 className="text-3xl font-bold mb-2">Recruiter Profile</h1>
        <p className="text-muted-foreground">Manage your recruiting preferences and school information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
          <CardDescription>Tell athletes about your program</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

            <div className="space-y-2 md:col-span-2">
              <Label>Your Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Head Coach, Recruiting Coordinator"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recruiting Preferences</CardTitle>
          <CardDescription>What positions and regions do you recruit?</CardDescription>
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
        <Button onClick={handleSave} disabled={saving || !formData.school_name}>
          {saving ? "Saving..." : "Save Profile"}
        </Button>
        <Button variant="outline" onClick={() => navigate("/recruiter/dashboard")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
