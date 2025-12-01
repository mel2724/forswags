import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, TrendingUp, Users, BookOpen, DollarSign, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Sponsors = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/forswags-logo.png" alt="ForSWAGs" className="h-12" />
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Button variant="ghost" onClick={() => navigate("/")} className="text-primary hover:text-primary/80 font-bold">
              Home
            </Button>
            <Button variant="ghost" onClick={() => navigate("/players")} className="text-primary hover:text-primary/80 font-bold">
              Athletes
            </Button>
            <Button variant="ghost" onClick={() => navigate("/sponsor-showcase")} className="text-primary hover:text-primary/80 font-bold">
              Our Sponsors
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
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-subtle opacity-50" />
        <div className="container relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gradient-primary">
            Partner With Us
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Help us empower the next generation of student athletes with life skills beyond the game
          </p>
          <Button size="lg" className="btn-hero" onClick={() => window.location.href = "mailto:partnerships@forswags.com"}>
            Become a Sponsor
          </Button>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground">
              Preparing student athletes for success in life, not just sports
            </p>
          </div>
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                The Playbook for Life
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Less than 2% of student athletes make it to professional sports. The other 98% need essential life skills to succeed beyond the field, court, or track. Our <span className="font-semibold text-foreground">Playbook for Life</span> provides comprehensive education in:
              </p>
              <ul className="grid md:grid-cols-2 gap-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  Financial literacy and money management
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  Career planning and professional development
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  Personal branding and networking
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  Mental health and wellness strategies
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  Leadership and communication skills
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  Life transition preparation
                </li>
              </ul>
              <p className="text-muted-foreground pt-4">
                By keeping our platform affordable, we ensure that <span className="font-semibold text-foreground">every student athlete</span>, regardless of their financial background, has access to these critical life skills that will serve them for decades to come.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Social Impact</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle className="text-4xl font-bold">10,000+</CardTitle>
                <CardDescription>Student Athletes Reached</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Empowering young athletes across the nation with essential life skills
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle className="text-4xl font-bold">98%</CardTitle>
                <CardDescription>Need Life Skills Beyond Sports</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Less than 2% go pro—we prepare them for what comes next
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Heart className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle className="text-4xl font-bold">$97</CardTitle>
                <CardDescription>Affordable Access to Life-Changing Education</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Kept low through sponsorships to maximize reach and impact
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Sponsor */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Your Sponsorship Matters</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <DollarSign className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Keep Costs Low & Accessible</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your sponsorship allows us to maintain affordable pricing, ensuring that financial barriers don't prevent talented student athletes from accessing life-changing education. Every dollar you contribute directly reduces the burden on families and increases our reach.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Expand Our Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  With sponsor support, we can scale our platform to reach more student athletes across the country. More students empowered means more young people prepared for successful careers and fulfilling lives beyond athletics.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Enhance Educational Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sponsorship funds enable us to continuously develop and improve the Playbook for Life curriculum, bringing in expert coaches, creating new courses, and keeping content relevant to today's challenges.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Target className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Create Lasting Social Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  By investing in financial literacy, career planning, and life skills education, you're helping break cycles of financial instability and creating opportunities for student athletes to build generational wealth and success.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sponsorship Tiers */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Sponsorship Opportunities</h2>
          <div className="space-y-6">
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-2xl">Platinum Partner</CardTitle>
                <CardDescription>$50,000+ annually</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    Prominent logo placement on platform and marketing materials
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    Exclusive naming rights for Playbook for Life modules
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    Speaking opportunities at events and webinars
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    Quarterly impact reports and student success stories
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Gold Partner</CardTitle>
                <CardDescription>$25,000+ annually</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    Logo placement on website and course materials
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    Recognition in press releases and social media
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    Annual impact reports
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Silver Partner</CardTitle>
                <CardDescription>$10,000+ annually</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    Logo on sponsors page
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    Social media recognition
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    Annual summary report
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Community Partner</CardTitle>
                <CardDescription>Any amount welcome</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    Recognition on sponsors page
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    Supporting the next generation of student athletes
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    Making life skills education accessible to all
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-subtle">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Us in Empowering the Next Generation
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Your sponsorship doesn't just support a platform—it transforms lives. Together, we can ensure every student athlete has the tools to succeed in life, not just in sports.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="btn-hero" onClick={() => window.location.href = "mailto:partnerships@forswags.com"}>
              Become a Sponsor
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.location.href = "mailto:partnerships@forswags.com?subject=Request Sponsorship Information"}>
              Request Information
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-b from-background to-card py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6">
            <img src="/forswags-logo.png" alt="ForSWAGs" className="h-20 mx-auto" />
            
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
              © 2019 ForSWAGs · For Students With Athletic Goals
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Sponsors;
