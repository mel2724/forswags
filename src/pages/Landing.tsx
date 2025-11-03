// Landing Page - Build 2025-01-07-002
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, GraduationCap, Target, Users, Star, Zap, Award, BarChart3, Medal, ChevronDown, Video, Brain, Sparkles, TrendingUp, Share2, BookOpen } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import heroImage from "@/assets/hero5.png";

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
    "url": "https://forswags.org",
    "logo": "https://forswags.org/src/assets/forswags-logo.png",
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
      <section className="relative min-h-[90vh] lg:min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90">
        <div className="container mx-auto px-4 py-16 lg:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="text-white space-y-6 lg:space-y-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                Don't wait for luck.
                <br />
                <span className="block mt-2">Take control of your future.</span>
              </h1>
              
              <p className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-xl">
                Get your recruitment profile in front of top coaches with FORSWAGS
              </p>
              
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 text-base sm:text-lg px-8 py-6 font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigateTo("/auth")}
              >
                Join the ForSwags family
                <Zap className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Right Image */}
            <div className="relative lg:block hidden">
              <div className="relative">
                <img 
                  src={heroImage} 
                  alt="Student athlete in action" 
                  className="w-full h-auto max-w-lg ml-auto relative z-10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section 1 */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="aspect-[4/3] bg-muted rounded-2xl overflow-hidden">
                <Video className="w-full h-full object-cover text-muted-foreground/20 p-20" />
              </div>
            </div>
            
            <div className="space-y-6 order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Get Noticed by College Coaches
              </h2>
              <p className="text-xl sm:text-2xl font-semibold text-primary">
                Blast Your Film to Thousands Instantly!
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center mt-1">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">Tired of cold-calling coaches?</p>
                    <p className="text-muted-foreground">Reach them all effortlessly with our platform.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center mt-1">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">Filter through thousands of schools</p>
                    <p className="text-muted-foreground">Find your perfect fit based on your skills and goals.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center mt-1">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">Get detailed analytics</p>
                    <p className="text-muted-foreground">See which coaches are most interested in your talent.</p>
                  </div>
                </li>
              </ul>
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-semibold"
                onClick={() => navigateTo("/auth")}
              >
                Join Swags Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section 2 */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Unlock Your Recruiting Dream!
              </h2>
              <p className="text-xl sm:text-2xl font-semibold text-primary">
                Get Contact Info for Every College Coach.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center mt-1">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">Forget tedious research</p>
                    <p className="text-muted-foreground">Access complete coach contact info instantly.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center mt-1">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">Tired of generic searches?</p>
                    <p className="text-muted-foreground">Narrow down your options with powerful filters.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center mt-1">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">No more endless questionnaires</p>
                    <p className="text-muted-foreground">Find programs actively seeking your talent.</p>
                  </div>
                </li>
              </ul>
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-semibold"
                onClick={() => navigateTo("/auth")}
              >
                Join Swags Now
              </Button>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] bg-muted rounded-2xl overflow-hidden">
                <BarChart3 className="w-full h-full object-cover text-muted-foreground/20 p-20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              How Does It Work?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">Build Your Winning Profile</h3>
              <p className="text-muted-foreground">
                Create your athletic profile and showcase your skills, stats, and experience.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">Get Seen by Thousands</h3>
              <p className="text-muted-foreground">
                Unlock access to 90% of active college coaches across the nation.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">Find Your Perfect Fit</h3>
              <p className="text-muted-foreground">
                Utilize powerful targeting tools to filter coaches based on your preferences.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <Share2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">Promotion</h3>
              <p className="text-muted-foreground">
                Get FREE social media promotion to maximize your exposure and attract coaches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Start Winning Today
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
              <Card className="p-8 bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 shadow-sm">
                <h3 className="text-2xl font-bold mb-4">Starter</h3>
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
                <Button className="w-full" variant="outline" onClick={() => navigateTo("/auth")}>
                  Get Started
                </Button>
              </Card>

              <Card className="p-8 bg-primary text-white relative transform scale-105 shadow-xl border-4 border-primary">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-primary px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  ⚡ Most Popular
                </div>
                <h3 className="text-2xl font-bold mb-4">Pro Monthly</h3>
                <div className="mb-6">
                  <div className="text-5xl font-black mb-2">
                    $14<span className="text-3xl">.99</span>
                  </div>
                  <div className="text-sm text-muted-foreground uppercase">Per Month</div>
                </div>
                <ul className="space-y-4 mb-8 text-sm">
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-white flex-shrink-0" />
                    <span className="font-semibold">Full athlete profile & highlights</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-white flex-shrink-0" />
                    <span className="font-semibold">Unlimited training courses</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-white flex-shrink-0" />
                    <span className="font-semibold">Coach evaluations & feedback</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-white flex-shrink-0" />
                    <span className="font-semibold">Expert "Prime Dime" matching</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-white flex-shrink-0" />
                    <span className="font-semibold">Performance analytics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-white flex-shrink-0" />
                    <span className="font-semibold">Free parent account included</span>
                  </li>
                </ul>
                <Button className="w-full bg-white text-primary hover:bg-white/90 font-semibold" onClick={() => navigateTo("/auth")}>
                  Start Training
                </Button>
              </Card>

              <Card className="p-8 bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 shadow-sm">
                <h3 className="text-2xl font-bold mb-4">Championship</h3>
                <div className="mb-6">
                  <div className="text-5xl font-black mb-2">
                    $97
                  </div>
                  <div className="text-sm text-primary font-bold">Per Year · Save $82!</div>
                </div>
                <ul className="space-y-4 mb-8 text-sm">
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Everything in Pro</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Priority coach support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Advanced analytics dashboard</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Exclusive training content</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Direct recruiter messaging</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold">Free parent account included</span>
                  </li>
                </ul>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold" onClick={() => navigateTo("/auth")}>
                  Go Championship
                </Button>
              </Card>
            </div>
          )}

          {/* Parent Plans */}
          {selectedRole === "parent" && (
            <div className="max-w-2xl mx-auto">
              <Card className="p-12 bg-card border-2 border-primary shadow-lg">
                <div className="text-center mb-8">
                  <Users className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-3xl font-bold mb-4 text-primary">Parent Access</h3>
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

