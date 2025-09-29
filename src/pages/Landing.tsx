import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import logoFull from "@/assets/logo-full.jpeg";
import { Trophy, GraduationCap, Target, TrendingUp, Users, Star, Zap, Award, BarChart3, Dumbbell, Medal, Flame } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/10 to-background sports-pattern"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(155,81,224,0.1),transparent_50%)]"></div>
        
        {/* Floating sports icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Trophy className="absolute top-20 left-[10%] h-16 w-16 text-primary/20 animate-pulse" />
          <Zap className="absolute top-40 right-[15%] h-20 w-20 text-secondary/20 animate-bounce" style={{ animationDuration: '3s' }} />
          <Medal className="absolute bottom-32 left-[20%] h-12 w-12 text-primary/20 animate-pulse" style={{ animationDelay: '1s' }} />
          <Flame className="absolute bottom-40 right-[10%] h-16 w-16 text-secondary/30 animate-bounce" style={{ animationDuration: '4s' }} />
          <Award className="absolute top-1/2 left-[5%] h-14 w-14 text-primary/15 animate-pulse" style={{ animationDelay: '2s' }} />
          <Dumbbell className="absolute top-1/3 right-[8%] h-12 w-12 text-secondary/20" />
        </div>
        
        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <div className="mb-8 animate-in fade-in duration-700">
            <img src={logoFull} alt="ForSWAGs" className="h-24 mx-auto drop-shadow-2xl" />
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 glow-text">
            DOMINATE
            <br />
            <span className="text-gradient-accent">THE GAME</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-foreground/80 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 font-medium">
            The ultimate platform for student-athletes to showcase talent, get recruited, and reach the next level
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 mb-12">
            <Button 
              size="lg" 
              className="btn-accent text-lg px-10 py-7 text-base font-bold uppercase tracking-wide"
              onClick={() => navigate("/auth")}
            >
              <Zap className="mr-2 h-5 w-5" />
              Start Your Journey
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-primary/50 bg-card/50 backdrop-blur text-foreground hover:bg-primary hover:text-primary-foreground text-lg px-10 py-7 font-bold uppercase tracking-wide"
              onClick={() => navigate("/players")}
            >
              <Users className="mr-2 h-5 w-5" />
              Scout Athletes
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto animate-in fade-in duration-700 delay-500">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-gradient-primary mb-2">1000+</div>
              <div className="text-sm md:text-base text-muted-foreground uppercase tracking-wide">Athletes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-gradient-accent mb-2">500+</div>
              <div className="text-sm md:text-base text-muted-foreground uppercase tracking-wide">Colleges</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-gradient-primary mb-2">$2M+</div>
              <div className="text-sm md:text-base text-muted-foreground uppercase tracking-wide">Scholarships</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight">
              <span className="text-gradient-primary">Level Up</span> Your Game
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to get recruited and dominate your sport
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Elite Profile</h3>
              <p className="text-muted-foreground leading-relaxed">
                Build a professional athlete profile with stats, highlights, and achievements that recruiters notice
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-secondary/20 hover:border-secondary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-secondary/10 rounded-lg w-fit mb-6 group-hover:bg-secondary/20 transition-colors">
                <Target className="h-10 w-10 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Smart Matching</h3>
              <p className="text-muted-foreground leading-relaxed">
                AI-powered college matching finds perfect programs for your athletic and academic goals
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Pro Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">
                Track performance with advanced stats and rankings that show your growth over time
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-secondary/20 hover:border-secondary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-secondary/10 rounded-lg w-fit mb-6 group-hover:bg-secondary/20 transition-colors">
                <Award className="h-10 w-10 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Expert Training</h3>
              <p className="text-muted-foreground leading-relaxed">
                Learn from the best with courses, drills, and evaluations from experienced coaches
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <Medal className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Earn Badges</h3>
              <p className="text-muted-foreground leading-relaxed">
                Unlock achievements and showcase your dedication with digital badges and awards
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-secondary/20 hover:border-secondary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-secondary/10 rounded-lg w-fit mb-6 group-hover:bg-secondary/20 transition-colors">
                <GraduationCap className="h-10 w-10 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Get Recruited</h3>
              <p className="text-muted-foreground leading-relaxed">
                Connect directly with college coaches and recruiters looking for talent like yours
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight">
              Start <span className="text-gradient-accent">Winning</span> Today
            </h2>
            <p className="text-xl text-muted-foreground">Choose the plan that fits your goals</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-border hover:border-primary/50 transition-all duration-300">
              <h3 className="text-2xl font-bold mb-4 uppercase tracking-wide">Starter</h3>
              <div className="mb-6">
                <div className="text-5xl font-black mb-2">FREE</div>
                <div className="text-sm text-muted-foreground uppercase">Forever</div>
              </div>
              <ul className="space-y-4 mb-8 text-sm">
                <li className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  </div>
                  <span>Basic athlete profile</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  </div>
                  <span>Browse athlete directory</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  </div>
                  <span>Access to 3 training courses</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline" onClick={() => navigate("/auth")}>
                Get Started
              </Button>
            </Card>

            <Card className="p-8 bg-gradient-to-b from-primary/10 to-card/50 backdrop-blur border-4 border-primary relative transform scale-105 shadow-2xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-secondary to-secondary-glow text-black px-6 py-2 rounded-full text-sm font-black uppercase tracking-wider shadow-lg">
                ⚡ Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-4 uppercase tracking-wide text-primary">Pro Monthly</h3>
              <div className="mb-6">
                <div className="text-5xl font-black mb-2">
                  $14<span className="text-3xl">.99</span>
                </div>
                <div className="text-sm text-muted-foreground uppercase">Per Month</div>
              </div>
              <ul className="space-y-4 mb-8 text-sm">
                <li className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="font-semibold">Full athlete profile & highlights</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="font-semibold">Unlimited training courses</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="font-semibold">Coach evaluations & feedback</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="font-semibold">AI college matching</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="font-semibold">Performance analytics</span>
                </li>
              </ul>
              <Button className="w-full btn-hero" onClick={() => navigate("/auth")}>
                Start Training
              </Button>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-secondary/30 hover:border-secondary/50 transition-all duration-300">
              <h3 className="text-2xl font-bold mb-4 uppercase tracking-wide">Championship</h3>
              <div className="mb-6">
                <div className="text-5xl font-black mb-2 text-gradient-accent">
                  $97
                </div>
                <div className="text-sm text-secondary uppercase font-bold">Per Year · Save $82!</div>
              </div>
              <ul className="space-y-4 mb-8 text-sm">
                <li className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="font-semibold">Everything in Pro</span>
                </li>
                <li className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="font-semibold">Priority coach support</span>
                </li>
                <li className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="font-semibold">Advanced analytics dashboard</span>
                </li>
                <li className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="font-semibold">Exclusive training content</span>
                </li>
                <li className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="font-semibold">Direct recruiter messaging</span>
                </li>
              </ul>
              <Button className="w-full btn-accent" onClick={() => navigate("/auth")}>
                Go Championship
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-b from-background to-card py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6">
            <img src={logoFull} alt="ForSWAGs" className="h-20 mx-auto" />
            
            <div className="max-w-3xl mx-auto">
              <p className="text-xs text-muted-foreground leading-relaxed border-l-4 border-secondary pl-4 text-left">
                <strong className="text-secondary uppercase tracking-wide">Important Disclaimer:</strong> ForSWAGs is an athletic development and college matching platform. 
                We are not recruiters and do not guarantee college placement or scholarships. 
                Results depend on individual effort, performance, and external factors beyond our control.
              </p>
            </div>
            
            <div className="flex justify-center gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Contact</a>
            </div>
            
            <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
              © 2025 ForSWAGs · For Students With Athletic Goals
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;