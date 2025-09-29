import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import logoIcon from "@/assets/logo-icon.png";
import { Trophy, GraduationCap, FileText, Star, LogOut } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Get profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);

      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (roleData) {
        setRole(roleData.role);
      }

      setLoading(false);
    };

    checkAuth();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/10">
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={logoIcon} alt="ForSWAGs" className="h-10" />
            <span className="text-xl font-bold text-gradient-primary">ForSWAGs</span>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {profile?.full_name || "User"}!
          </h1>
          <p className="text-muted-foreground">
            Your role: <span className="font-semibold capitalize">{role}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/players")}>
            <Trophy className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-bold text-lg mb-2">Player Directory</h3>
            <p className="text-sm text-muted-foreground">Browse athlete profiles</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/courses")}>
            <GraduationCap className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-bold text-lg mb-2">Courses</h3>
            <p className="text-sm text-muted-foreground">Educational content</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/evaluations")}>
            <FileText className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-bold text-lg mb-2">Evaluations</h3>
            <p className="text-sm text-muted-foreground">Get expert feedback</p>
          </Card>

          {role === "admin" && (
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin")}>
              <Star className="h-8 w-8 text-secondary mb-3" />
              <h3 className="font-bold text-lg mb-2">Admin Console</h3>
              <p className="text-sm text-muted-foreground">Manage platform</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;