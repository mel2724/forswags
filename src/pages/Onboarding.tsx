import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Users, Trophy, Search, Shield } from "lucide-react";

type Role = "athlete" | "parent" | "coach" | "recruiter" | "admin";

const roles = [
  { value: "athlete", label: "Athlete", icon: Trophy, description: "Student-athlete building their profile" },
  { value: "parent", label: "Parent", icon: Users, description: "Supporting my athlete's journey" },
  { value: "coach", label: "Coach", icon: User, description: "Evaluating and mentoring athletes" },
  { value: "recruiter", label: "Recruiter", icon: Search, description: "Discovering talent for college programs" },
  { value: "admin", label: "Admin", icon: Shield, description: "Platform administration" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("athlete");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
    };

    checkAuth();
  }, [navigate]);

  const handleContinue = async () => {
    if (!userId) return;

    setLoading(true);

    try {
      // Insert user role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: selectedRole });

      if (roleError) throw roleError;

      // Create free membership
      const { error: membershipError } = await supabase
        .from("memberships")
        .insert({ 
          user_id: userId, 
          plan: "free",
          status: "active"
        });

      if (membershipError) throw membershipError;

      toast.success("Welcome to ForSWAGs!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Error setting up account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/10 p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gradient-primary">Choose Your Role</h1>
          <p className="text-muted-foreground">How will you be using ForSWAGs?</p>
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

        <Button onClick={handleContinue} className="w-full btn-hero" disabled={loading}>
          {loading ? "Setting up..." : "Continue"}
        </Button>
      </Card>
    </div>
  );
};

export default Onboarding;