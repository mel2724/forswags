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
    <div className="min-h-screen bg-background sports-pattern">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={logoIcon} alt="ForSWAGs" className="h-10" />
            <span className="text-xl font-black uppercase tracking-tight text-gradient-primary">ForSWAGs</span>
          </div>
          <Button variant="ghost" onClick={handleSignOut} className="hover:text-primary">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-black mb-3 uppercase tracking-tight glow-text">
            Welcome back, {profile?.full_name || "Athlete"}!
          </h1>
          <p className="text-muted-foreground uppercase text-sm tracking-wider">
            Role: <span className="font-bold capitalize text-secondary">{role}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-card/50 backdrop-blur border-2 border-primary/20 hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer group" onClick={() => navigate("/players")}>
            <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 group-hover:bg-primary/20 transition-colors">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2 uppercase tracking-tight">Athletes</h3>
            <p className="text-sm text-muted-foreground">Browse athlete profiles</p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-2 border-secondary/20 hover:border-secondary hover:shadow-xl hover:shadow-secondary/20 transition-all duration-300 cursor-pointer group" onClick={() => navigate("/courses")}>
            <div className="p-3 bg-secondary/10 rounded-lg w-fit mb-4 group-hover:bg-secondary/20 transition-colors">
              <GraduationCap className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="font-bold text-lg mb-2 uppercase tracking-tight">Training</h3>
            <p className="text-sm text-muted-foreground">Educational content</p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-2 border-primary/20 hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer group" onClick={() => navigate("/evaluations")}>
            <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 group-hover:bg-primary/20 transition-colors">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2 uppercase tracking-tight">Evaluations</h3>
            <p className="text-sm text-muted-foreground">Expert feedback</p>
          </Card>

          {role === "admin" && (
            <Card className="p-6 bg-card/50 backdrop-blur border-2 border-secondary/20 hover:border-secondary hover:shadow-xl hover:shadow-secondary/20 transition-all duration-300 cursor-pointer group" onClick={() => navigate("/admin")}>
              <div className="p-3 bg-secondary/10 rounded-lg w-fit mb-4 group-hover:bg-secondary/20 transition-colors">
                <Star className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-bold text-lg mb-2 uppercase tracking-tight">Admin</h3>
              <p className="text-sm text-muted-foreground">Manage platform</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;