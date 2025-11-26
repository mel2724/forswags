// Landing Page - Build 2025-01-07-002
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, GraduationCap, Target, Users, Star, Zap, Award, BarChart3, Medal, ChevronDown, Video, Brain, Sparkles, TrendingUp, Share2, BookOpen } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import heroImage from "@/assets/hero5.png";
import logoImage from "@/assets/forswags-logo.png";

export default function Landing() {
  // Use direct navigation to avoid Router context dependency
  const navigateTo = (path: string) => {
    window.location.href = path;
  };
  const [selectedRole, setSelectedRole] = useState<"athlete" | "parent">("athlete");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ForSWAGs",
    "description": "Student athlete development and &quot;Prime Dime&quot; matching platform",
    "url": "https://app.forswags.com",
    "logo": logoImage,
    "offers": [
      {
        "@type": "Offer",
        "name": "Pro Monthly",
        "price": "14.99",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "name": "Championship Yearly",
        "price": "97.00",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Student Athlete Development & College Recruitment Platform"
        description="Get professional coach evaluations, expert &quot;Prime Dime&quot; matching, life skills training, and social media tools. Build your profile and connect with college recruiters nationwide."
        keywords="student athlete platform, college recruitment, coach evaluations, athlete training, &quot;Prime Dime&quot; matching, sports scholarships, athlete development, recruiting profile"
        structuredData={structuredData}
      />
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-primary/40 to-background/80"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(155,81,224,0.2),transparent_50%)]"></div>
        
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
              onClick={() => navigateTo("/auth")}
            >
              <Zap className="mr-2 h-5 w-5" />
              Start Your Journey
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
                <Video className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Pro Coach Evaluations</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get professionally scouted by experienced coaches with detailed video analysis and performance feedback
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-secondary/20 hover:border-secondary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-secondary/10 rounded-lg w-fit mb-6 group-hover:bg-secondary/20 transition-colors">
                <Brain className="h-10 w-10 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Expert "Prime Dime" Matching</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our expert team personally reviews your profile to find your perfect college fit based on athletics, academics, and personal preferences
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <BookOpen className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Life Skills Training</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our Playbook for Life teaches leadership, character development, and real-world skills beyond athletics
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-secondary/20 hover:border-secondary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-secondary/10 rounded-lg w-fit mb-6 group-hover:bg-secondary/20 transition-colors">
                <Share2 className="h-10 w-10 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Social Media Tools</h3>
              <p className="text-muted-foreground leading-relaxed">
                AI-generated captions, custom graphics, and press releases help you build your brand and get noticed
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">National Exposure</h3>
              <p className="text-muted-foreground leading-relaxed">
                Public athlete profiles visible to college recruiters nationwide—showcase your talent 24/7
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-secondary/20 hover:border-secondary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-secondary/10 rounded-lg w-fit mb-6 group-hover:bg-secondary/20 transition-colors">
                <Sparkles className="h-10 w-10 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Holistic Rankings</h3>
              <p className="text-muted-foreground leading-relaxed">
                Unique ranking system that evaluates both athletic ability and life skills—no traditional star ratings
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
                    <span>Access to Playbook for Life courses</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline" onClick={() => navigateTo("/auth")}>
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
                    <span className="font-semibold">Playbook for Life courses</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Coach evaluations & feedback*</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Prime Dime Expert College Matching Reports</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Performance analytics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Social media tools</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Direct College scout messaging</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Free parent account included</span>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground mb-4">*Coach evaluations require an additional fee</p>
                <Button className="w-full btn-hero" onClick={() => navigateTo("/auth")}>
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
                    <span className="font-semibold">Full athlete profile & highlights</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="font-semibold">Playbook for Life courses</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="font-semibold">Coach evaluations & feedback*</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="font-semibold">Prime Dime Expert College Matching Reports</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="font-semibold">Performance analytics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="font-semibold">Social media tools</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="font-semibold">Direct College scout messaging</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="font-semibold">Free parent account included</span>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground mb-4">*Coach evaluations require an additional fee</p>
                <Button className="w-full btn-accent" onClick={() => navigateTo("/auth")}>
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
                <Button className="w-full btn-hero text-lg py-6" onClick={() => navigateTo("/auth")}>
                  Create Parent Account
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
            {[
              {
                question: "What is ForSWAGs?",
                answer: "ForSWAGs stands for For Students With Athletic Goals. We're a platform built by experienced coaches, scouts, and educators to help student-athletes succeed both on the field and in life. We combine recruiting exposure with life-skills education so every athlete has the tools to reach their full potential."
              },
              {
                question: "How is ForSWAGs different from other recruiting services?",
                answer: "Unlike most recruiting companies that promise scholarships and charge thousands upfront, ForSWAGs is built on education, exposure, and affordability. Our membership is only $97 per year, and all life-skills courses are included, even for free accounts. Athletic evaluations, training, and promotional services are offered as affordable add-ons, not overpriced bundles."
              },
              {
                question: "What's included in a membership?",
                answer: "All memberships include: Unlimited access to the Playbook for Life courses, A professional athlete profile with stats and media, Access to training courses (3 for Starter, unlimited for Pro & Championship), Progress tracking with rankings and badges, Connection with our community and alumni network"
              },
              {
                question: "What's the difference between Starter, Pro, and Championship?",
                answer: "Starter (Free): Limited profile features, 3 training courses, browse athlete directory. Pro Monthly ($14.99): Full profile, unlimited courses, coach evaluations, The &quot;Prime Dime&quot; matching, analytics, free parent account. Championship Yearly ($97): Everything in Pro, plus priority support, advanced analytics, exclusive content, direct recruiter messaging, and you save $82 per year."
              },
              {
                question: "What services can I add on to my membership?",
                answer: "Athletes and families can choose from a variety of add-on services, such as: Player Evaluations ($97 initial, $49 each additional), Player Skills Training Courses ($99, position-specific), Highlight promotion on ForSWAGs social media (70K+ followers, many coaches watching), The &quot;Prime Dime&quot; List (10 schools tailored to your goals)"
              },
              {
                question: "Who can join ForSWAGs?",
                answer: "ForSWAGs is open to all student-athletes, boys and girls, ages 8–18, in any sport. Whether you're just starting out or already playing at a high level, we'll help you grow. Parents and recruiters are also welcome as part of our learning community."
              },
              {
                question: "What is the Playbook for Life?",
                answer: "The Playbook for Life is our signature series of life-skills courses included in every membership. Topics include respect, responsibility, nutrition, mindset, leadership, dealing with adversity, and preparing for careers beyond sports. Every lesson completed boosts your overall ranking, combining both athletic and life skills."
              },
              {
                question: "How do I sign up?",
                answer: "It's simple: 1. Click Join Now, 2. Choose your membership (only $97/year or $14.99/month), 3. Start building your profile and accessing your courses immediately"
              },
              {
                question: "Can parents use ForSWAGs, too?",
                answer: "Absolutely. Parents can learn about supporting their athlete's journey (sideline behavior, nutrition, navigating recruiting scams). ForSWAGs is built as a team resource, not just for players."
              },
              {
                question: "How do rankings work?",
                answer: "Our rankings are unique—we don't use the traditional \"star system.\" Instead, athletes are evaluated based on both their athletic ability and their life skills progress from the Playbook for Life. This creates a fair, unbiased, and well-rounded ranking system that college coaches respect."
              }
            ].map((faq, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur border-2 border-border hover:border-primary/50 transition-all">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 group"
                >
                  <span className="font-bold text-lg group-hover:text-primary transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown 
                    className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

