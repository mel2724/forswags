import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logoIcon from "@/assets/logo-icon.png";
import { ArrowLeft } from "lucide-react";

const Players = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/10">
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={logoIcon} alt="ForSWAGs" className="h-10" />
            <span className="text-xl font-bold text-gradient-primary">ForSWAGs</span>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Player Directory</h1>
          <p className="text-muted-foreground">Browse student-athlete profiles</p>
        </div>

        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
          <p className="text-muted-foreground mb-6">
            The player directory is being built. Sign up to get notified when it launches!
          </p>
          <Button className="btn-hero" onClick={() => navigate("/auth")}>
            Sign Up Now
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default Players;