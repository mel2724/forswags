import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import logoFull from "@/assets/forswags-logo.png";
import { Trophy, GraduationCap, Target, Users, Star, Zap, Award, BarChart3, Medal } from "lucide-react";
// Temporarily removed Select to force cache rebuild
// Temporarily removed to force cache rebuild

const Landing = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<"athlete" | "parent" | "recruiter">("athlete");

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src={logoFull} alt="ForSWAGs" className="h-12" />
          </div>
          
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <a href="#features" className="text-primary hover:text-primary/80 transition-colors font-bold">Features</a>
            <a href="#pricing" className="text-primary hover:text-primary/80 transition-colors font-bold">Pricing</a>
            <Button variant="ghost" onClick={() => navigate("/players")} className="text-primary hover:text-primary/80 font-bold">
              Athletes
            </Button>
            <Button variant="ghost" onClick={() => navigate("/sponsors")} className="text-primary hover:text-primary/80 font-bold">
              Sponsors
            </Button>
            <Button onClick={() => navigate("/auth")} className="btn-hero">
              Sign Up
            </Button>
          </nav>

          <Button 
            className="md:hidden btn-hero" 
            onClick={() => navigate("/auth")}
          >
            Sign Up
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/10 to-background sports-pattern"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(155,81,224,0.1),transparent_50%)]"></div>
        
        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 glow-text">
            DOMINATE
            <br />
            <span className="text-gradient-accent">THE GAME</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-foreground/80 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 font-medium">
            The ultimate platform for student-athletes to showcase talent, get recruited, and reach the next level
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
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
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
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
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">College Matches</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our expert team personally matches you with colleges that fit your athletic and academic profile
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
      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight">
              Start <span className="text-gradient-accent">Winning</span> Today
            </h2>
            <p className="text-xl text-muted-foreground mb-8">Choose the plan that fits your goals</p>
            
            {/* Role Selector */}
            <div className="flex justify-center mb-8 gap-2">
              <Button
                variant={selectedRole === "athlete" ? "default" : "outline"}
                onClick={() => setSelectedRole("athlete")}
                className="text-sm font-bold"
              >
                Student Athlete
              </Button>
              <Button
                variant={selectedRole === "parent" ? "default" : "outline"}
                onClick={() => setSelectedRole("parent")}
                className="text-sm font-bold"
              >
                Parent/Guardian
              </Button>
              <Button
                variant={selectedRole === "recruiter" ? "default" : "outline"}
                onClick={() => setSelectedRole("recruiter")}
                className="text-sm font-bold"
              >
                College Recruiter
              </Button>
            </div>
          </div>
          
          {/* Athlete Plans */}
          {selectedRole === "athlete" && (
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
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Free parent account included</span>
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
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="font-semibold">Free parent account included</span>
                  </li>
                </ul>
                <Button className="w-full btn-accent" onClick={() => navigate("/auth")}>
                  Go Championship
                </Button>
              </Card>
            </div>
          )}

          {/* Parent Plans */}
          {selectedRole === "parent" && (
            <div className="max-w-2xl mx-auto">
              <Card className="p-12 bg-gradient-to-b from-primary/10 to-card/50 backdrop-blur border-4 border-primary shadow-2xl">
                <div className="text-center mb-8">
                  <Users className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-3xl font-bold mb-4 uppercase tracking-wide text-primary">Parent Access</h3>
                  <div className="mb-6">
                    <div className="text-6xl font-black mb-2">FREE</div>
                    <div className="text-lg text-muted-foreground">With Paid Student Athlete Account</div>
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <Zap className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="font-semibold text-lg">Full access to Playbook for Life</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="font-semibold text-lg">View your athlete's profile & progress</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="font-semibold text-lg">Track recruiting activities</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="font-semibold text-lg">Access training resources</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="font-semibold text-lg">Receive notifications & updates</span>
                  </li>
                </ul>
                <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/30 mb-6">
                  <p className="text-sm text-center">
                    Parent accounts are automatically included with any paid athlete membership (Pro Monthly or Championship Yearly)
                  </p>
                </div>
                <Button className="w-full btn-hero text-lg py-6" onClick={() => navigate("/auth")}>
                  Create Parent Account
                </Button>
              </Card>
            </div>
          )}

          {/* Recruiter Plans */}
          {selectedRole === "recruiter" && (
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="p-8 bg-card/50 backdrop-blur border-2 border-primary/30 hover:border-primary/50 transition-all duration-300">
                <div className="text-center mb-6">
                  <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-4 uppercase tracking-wide">Recruiter Monthly</h3>
                  <div className="mb-6">
                    <div className="text-5xl font-black mb-2">
                      $97
                    </div>
                    <div className="text-sm text-muted-foreground uppercase">Per Month</div>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 text-sm">
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Full athlete database access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Advanced search & filters</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Direct messaging to athletes</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Save & organize prospects</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Analytics & insights</span>
                  </li>
                </ul>
                <Button className="w-full btn-hero" onClick={() => navigate("/auth")}>
                  Start Recruiting
                </Button>
              </Card>

              <Card className="p-8 bg-gradient-to-b from-secondary/10 to-card/50 backdrop-blur border-4 border-secondary relative shadow-2xl">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary-glow text-white px-6 py-2 rounded-full text-sm font-black uppercase tracking-wider shadow-lg">
                  💎 Best Value
                </div>
                <div className="text-center mb-6">
                  <Star className="h-12 w-12 text-secondary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-4 uppercase tracking-wide text-secondary">Recruiter Yearly</h3>
                  <div className="mb-6">
                    <div className="text-5xl font-black mb-2 text-gradient-accent">
                      $997
                    </div>
                    <div className="text-sm text-secondary uppercase font-bold">Per Year · Save $167!</div>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 text-sm">
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="font-semibold">Everything in Monthly</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="font-semibold">Priority customer support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="font-semibold">Exclusive recruiting events</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="font-semibold">Early access to new athletes</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="font-semibold">Custom reporting tools</span>
                  </li>
                </ul>
                <Button className="w-full btn-accent" onClick={() => navigate("/auth")}>
                  Go Yearly
                </Button>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background"></div>
        <div className="container mx-auto px-4 relative z-10 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight">
              Frequently Asked <span className="text-gradient-primary">Questions</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about ForSWAGs
            </p>
          </div>
          
          <div className="space-y-4">
            <Card className="p-6 bg-card/50 backdrop-blur border-2 border-border">
              <h3 className="font-bold text-lg mb-2">What is ForSWAGs?</h3>
              <p className="text-muted-foreground">
                ForSWAGs stands for For Students With Athletic Goals. We're a platform built by experienced coaches, scouts, and educators to help student-athletes succeed both on the field and in life.
              </p>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur border-2 border-border">
              <h3 className="font-bold text-lg mb-2">How is ForSWAGs different?</h3>
              <p className="text-muted-foreground">
                Unlike most recruiting companies that promise scholarships and charge thousands upfront, ForSWAGs is built on education, exposure, and affordability. Our membership is only $97 per year.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur border-2 border-border">
              <h3 className="font-bold text-lg mb-2">What does a membership include?</h3>
              <p className="text-muted-foreground">
                Your annual ForSWAGs membership includes a personalized Player Profile Page, access to the Playbook for Life, training modules, recruiting tips, and evaluation services.
              </p>
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
                ForSWAGs is an athletic development and college matching platform. 
                We are not recruiters and do not guarantee college placement or scholarships. 
                Results depend on individual effort, performance, and external factors beyond our control.
              </p>
            </div>
            
            <div className="flex justify-center gap-8 text-sm text-muted-foreground">
              <a href="/sponsors" className="hover:text-primary transition-colors">Sponsors</a>
              <a href="/sponsor-showcase" className="hover:text-primary transition-colors">Our Sponsors</a>
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