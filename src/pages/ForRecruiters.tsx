// Dedicated page for college recruiters and scouts
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Target, Star, Award, Zap, Search, MessageSquare, BarChart3, Users, Shield, Sparkles } from "lucide-react";

const ForRecruiters = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/10 to-background"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(155,81,224,0.1),transparent_50%)]"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            Find Your Next
            <br />
            <span className="text-gradient-accent">Championship Athlete</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-foreground/80 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            For verified college coaching staff: Access the nation's most comprehensive database of student-athletes with verified stats, video highlights, and holistic life skills rankings
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Button 
              size="lg" 
              className="btn-accent text-lg px-10 py-7 font-bold uppercase tracking-wide"
              onClick={() => navigate("/auth?type=staff")}
            >
              <Target className="mr-2 h-5 w-5" />
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight">
              <span className="text-gradient-primary">Powerful Tools</span> for College Staff
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything your coaching staff needs to find and evaluate top talent
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <Search className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Advanced Search</h3>
              <p className="text-muted-foreground leading-relaxed">
                Filter by sport, position, location, GPA, test scores, and more to find your ideal prospects
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-secondary/20 hover:border-secondary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-secondary/10 rounded-lg w-fit mb-6 group-hover:bg-secondary/20 transition-colors">
                <BarChart3 className="h-10 w-10 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Complete Profiles</h3>
              <p className="text-muted-foreground leading-relaxed">
                View verified stats, video highlights, academic records, and professional coach evaluations
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Video Analysis</h3>
              <p className="text-muted-foreground leading-relaxed">
                Access comprehensive video highlights with frame-by-frame analysis and performance breakdowns
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-secondary/20 hover:border-secondary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-secondary/10 rounded-lg w-fit mb-6 group-hover:bg-secondary/20 transition-colors">
                <Users className="h-10 w-10 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Prospect Management</h3>
              <p className="text-muted-foreground leading-relaxed">
                Save searches, organize prospects into lists, and track your scouting pipeline
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Life Skills Ratings</h3>
              <p className="text-muted-foreground leading-relaxed">
                Unique holistic rankings that evaluate character, leadership, and life skills alongside athletics
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-secondary/20 hover:border-secondary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-secondary/10 rounded-lg w-fit mb-6 group-hover:bg-secondary/20 transition-colors">
                <Shield className="h-10 w-10 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Verified Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                All athlete data is verified and updated regularly to ensure accuracy and reliability
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight">
              <span className="text-gradient-accent">College Staff Plan</span>
            </h2>
            <p className="text-xl text-muted-foreground">Annual subscription for full platform access</p>
          </div>
          
          <div className="max-w-md mx-auto">
            <Card className="p-8 bg-gradient-to-b from-secondary/10 to-card/50 backdrop-blur border-4 border-secondary relative shadow-2xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary-glow text-white px-6 py-2 rounded-full text-sm font-black uppercase tracking-wider shadow-lg">
                💎 Best Value
              </div>
              <div className="text-center mb-6">
                <Star className="h-12 w-12 text-secondary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4 uppercase tracking-wide text-secondary">College Staff Yearly</h3>
                <div className="mb-6">
                  <div className="text-5xl font-black mb-2 text-gradient-accent">
                    $997
                  </div>
                  <div className="text-sm text-secondary uppercase font-bold">Per Year</div>
                </div>
              </div>
              <ul className="space-y-4 mb-8 text-sm">
                <li className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="font-semibold">Full athlete database access</span>
                </li>
                <li className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="font-semibold">Advanced search & filters</span>
                </li>
                <li className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="font-semibold">Contact athlete information</span>
                </li>
                <li className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="font-semibold">Save & organize prospects</span>
                </li>
                <li className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="font-semibold">Analytics & insights</span>
                </li>
                <li className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="font-semibold">Priority customer support</span>
                </li>
                <li className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="font-semibold">Exclusive scouting events</span>
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
              <Button className="w-full btn-accent" onClick={() => navigate("/auth?type=staff")}>
                Get Started
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to Find Your <span className="text-gradient-accent">Next Star?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of college coaching staff already using ForSWAGs to discover top talent
          </p>
          <Button 
            size="lg" 
            className="btn-accent text-lg px-10 py-7 font-bold uppercase tracking-wide"
            onClick={() => navigate("/auth?type=staff")}
          >
            Get Started Today
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ForRecruiters;
