import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logoIcon from "@/assets/forswags-logo.png";
import { ArrowLeft, Trophy } from "lucide-react";

const Players = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background sports-pattern">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoIcon} alt="ForSWAGs" className="h-12" />
          </div>
          
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Button variant="ghost" onClick={() => navigate("/")} className="text-secondary hover:text-secondary/80 font-bold">
              Home
            </Button>
            <Button onClick={() => navigate("/auth")} className="btn-hero">
              Sign Up
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-black mb-3 uppercase tracking-tight">Athlete Directory</h1>
          <p className="text-muted-foreground uppercase text-sm tracking-wider">Discover the next generation of champions</p>
        </div>

        <Card className="p-16 text-center bg-card/50 backdrop-blur border-2 border-primary/20">
          <Trophy className="h-20 w-20 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-black uppercase mb-4 text-gradient-primary">Coming Soon</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            The athlete directory is under construction. Join now to be first in line when we launch!
          </p>
          <Button className="btn-accent" onClick={() => navigate("/auth")}>
            Get Early Access
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default Players;