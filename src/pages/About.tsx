import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Heart, Target, Users, Trophy, GraduationCap, Lightbulb } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tight">
              About <span className="text-gradient-primary">ForSWAGs</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Building Athletes, Shaping Futures
            </p>
          </div>
        </div>
      </section>

      {/* Vision Statement */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <Card className="p-8 md:p-12 bg-card/50 backdrop-blur border-2 border-primary/20 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-primary/10 rounded-lg">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight">Our Vision</h2>
            </div>
            
            <div className="space-y-6 text-lg leading-relaxed text-foreground/90">
              <p>
                ForSWAGs is a non-profit organization dedicated to empowering student-athletes on and off the field. 
                Our vision is to create a future where every athlete, regardless of background, has the tools, knowledge, 
                and opportunities to succeed in sports, academics, and life beyond the game.
              </p>
              
              <p>
                By combining our expert scouting knowledge, academic mentorship, life coaching, and national exposure, we aim to guide 
                athletes through the complexities of recruitment while instilling critical life skills for long-term success. 
                Through our holistic approach, we strive to build confident, well-rounded individuals prepared for college, 
                career, and beyond.
              </p>
              
              <p>
                Our mission extends beyond the field, prioritizing education, character development, and leadership to help 
                athletes navigate their personal and professional journeys. We believe that true success is not just about 
                making it to the next level in sports, but about shaping a legacy of discipline, integrity, and resilience.
              </p>
              
              <div className="pt-6 border-t border-primary/20 mt-8">
                <p className="text-xl font-bold text-primary">
                  ForSWAGs: Building athletes, shaping futures.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight">
              Our Core <span className="text-gradient-accent">Values</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Excellence</h3>
              <p className="text-muted-foreground leading-relaxed">
                We push athletes to reach their highest potential both on and off the field
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-secondary/20 hover:border-secondary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-secondary/10 rounded-lg w-fit mb-6 group-hover:bg-secondary/20 transition-colors">
                <Heart className="h-10 w-10 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Integrity</h3>
              <p className="text-muted-foreground leading-relaxed">
                Building character and making ethical decisions is at the heart of what we do
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <GraduationCap className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Education</h3>
              <p className="text-muted-foreground leading-relaxed">
                Academic success is just as important as athletic achievement in our program
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-secondary/20 hover:border-secondary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-secondary/10 rounded-lg w-fit mb-6 group-hover:bg-secondary/20 transition-colors">
                <Users className="h-10 w-10 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Community</h3>
              <p className="text-muted-foreground leading-relaxed">
                We create a supportive network where athletes, families, and mentors thrive together
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <Target className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Opportunity</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every athlete deserves access to resources and connections to reach their dreams
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-2 border-secondary/20 hover:border-secondary/50 transition-all duration-300 hover:-translate-y-2 group">
              <div className="p-3 bg-secondary/10 rounded-lg w-fit mb-6 group-hover:bg-secondary/20 transition-colors">
                <Lightbulb className="h-10 w-10 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Innovation</h3>
              <p className="text-muted-foreground leading-relaxed">
                We leverage technology and modern approaches to enhance athlete development
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <Card className="p-12 bg-gradient-to-br from-primary/10 via-card/50 to-secondary/10 backdrop-blur border-2 border-primary/30 max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-6 uppercase tracking-tight">
              Ready to <span className="text-gradient-accent">Start Your Journey?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of student-athletes who are reaching their full potential with ForSWAGs
            </p>
            <div className="flex justify-center">
              <Button 
                size="lg" 
                className="btn-hero text-lg px-10 py-7 font-bold uppercase tracking-wide"
                onClick={() => navigate("/auth")}
              >
                Get Started Free
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
