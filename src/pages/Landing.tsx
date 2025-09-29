import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import logoFull from "@/assets/logo-full.jpeg";
import { Trophy, GraduationCap, Target, TrendingUp, Users, Star } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-glow to-secondary/30 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <img src={logoFull} alt="ForSWAGs" className="h-24 mx-auto mb-8" />
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            Your Athletic Dreams
            <br />
            <span className="text-secondary">Start Here</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-white/90 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            Build your profile, showcase your skills, connect with colleges, and achieve your athletic goals
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Button 
              size="lg" 
              className="btn-accent text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20 text-lg px-8 py-6"
              onClick={() => navigate("/players")}
            >
              Browse Athletes
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient-primary">
            Everything You Need to Succeed
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <Trophy className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-3">Athletic Profile</h3>
              <p className="text-muted-foreground">
                Showcase your stats, highlights, and achievements in a professional profile that stands out
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <GraduationCap className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-3">College Matching</h3>
              <p className="text-muted-foreground">
                Smart algorithm matches you with colleges that fit your athletic and academic profile
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <Target className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-3">Expert Evaluations</h3>
              <p className="text-muted-foreground">
                Get professional feedback from experienced coaches to improve your game
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <TrendingUp className="h-12 w-12 text-secondary mb-4" />
              <h3 className="text-2xl font-bold mb-3">Rankings & Stats</h3>
              <p className="text-muted-foreground">
                Track your progress with comprehensive rankings and statistical analysis
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <Users className="h-12 w-12 text-secondary mb-4" />
              <h3 className="text-2xl font-bold mb-3">Training Courses</h3>
              <p className="text-muted-foreground">
                Access expert training modules to develop both athletic and academic skills
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <Star className="h-12 w-12 text-secondary mb-4" />
              <h3 className="text-2xl font-bold mb-3">Achievement Badges</h3>
              <p className="text-muted-foreground">
                Earn recognition for your accomplishments and showcase your dedication
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient-primary">
            Choose Your Plan
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-4">Free</h3>
              <div className="text-4xl font-bold mb-6">$0</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">✓ Basic profile</li>
                <li className="flex items-center">✓ Browse athletes</li>
                <li className="flex items-center">✓ Limited courses</li>
              </ul>
              <Button className="w-full" variant="outline" onClick={() => navigate("/auth")}>
                Start Free
              </Button>
            </Card>

            <Card className="p-8 border-primary border-2 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-black px-4 py-1 rounded-full text-sm font-bold">
                POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-4">Monthly</h3>
              <div className="text-4xl font-bold mb-6">
                $14.99<span className="text-lg text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">✓ Full profile access</li>
                <li className="flex items-center">✓ All courses</li>
                <li className="flex items-center">✓ Coach evaluations</li>
                <li className="flex items-center">✓ College matching</li>
              </ul>
              <Button className="w-full btn-hero" onClick={() => navigate("/auth")}>
                Get Started
              </Button>
            </Card>

            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-4">Annual</h3>
              <div className="text-4xl font-bold mb-6">
                $97<span className="text-lg text-muted-foreground">/yr</span>
              </div>
              <p className="text-sm text-secondary mb-6">Save $82/year!</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">✓ Everything in Monthly</li>
                <li className="flex items-center">✓ Priority support</li>
                <li className="flex items-center">✓ Advanced analytics</li>
                <li className="flex items-center">✓ Exclusive content</li>
              </ul>
              <Button className="w-full btn-accent" onClick={() => navigate("/auth")}>
                Best Value
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-8">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <img src={logoFull} alt="ForSWAGs" className="h-16 mx-auto brightness-0 invert" />
            <p className="text-sm opacity-80 max-w-2xl mx-auto">
              <strong>Disclaimer:</strong> ForSWAGs is an athletic development and college matching platform. 
              We are not recruiters and do not guarantee college placement or scholarships. 
              Results depend on individual effort, performance, and external factors beyond our control.
            </p>
            <p className="text-sm opacity-60">
              © 2025 ForSWAGs. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;