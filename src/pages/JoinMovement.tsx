import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, Zap, Users, BookOpen, TrendingUp } from "lucide-react";
import logoImage from "@/assets/forswags-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const waitlistSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  sport: z.string().trim().max(50, "Sport name too long").optional(),
  graduation_year: z.number().min(2024).max(2035).optional(),
  high_school: z.string().trim().max(200, "School name too long").optional(),
  parent_email: z.string().trim().email("Invalid parent email").max(255, "Email too long").optional().or(z.literal("")),
});

export default function JoinMovement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    sport: "",
    graduation_year: "",
    high_school: "",
    parent_email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      const validatedData = waitlistSchema.parse({
        ...formData,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : undefined,
        parent_email: formData.parent_email || undefined,
      });

      const { error } = await supabase.functions.invoke("join-waitlist", {
        body: validatedData,
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Welcome to the Movement!",
        description: "You're on the waitlist. We'll email you when memberships open.",
      });
    } catch (error: any) {
      console.error("Waitlist signup error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to join waitlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-background"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(155,81,224,0.1),transparent_50%)]"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10 max-w-2xl">
          <div className="mb-8">
            <div className="inline-flex p-6 bg-primary/10 rounded-full mb-6">
              <Check className="h-16 w-16 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            <span className="text-gradient-primary">YOU'RE IN!</span>
          </h1>
          
          <p className="text-xl mb-8 text-muted-foreground font-medium">
            Welcome to the ForSWAGs movement. We'll email you as soon as memberships open with instructions to claim your free profile.
          </p>
          
          <p className="text-sm text-muted-foreground">
            Check your email for updates • Follow us on social media to stay connected
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-background"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(155,81,224,0.1),transparent_50%)]"></div>
      
      {/* Header */}
      <div className="relative z-10 container mx-auto px-4 pt-8">
        <img src={logoImage} alt="ForSWAGs" className="h-16 md:h-20" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="glow-text">JOIN THE</span>
            <br />
            <span className="text-gradient-accent">MOVEMENT</span>
          </h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left side - Benefits */}
          <div className="space-y-8">
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-black mb-4 text-gradient-primary uppercase">
                Memberships Opening Soon
              </h2>
              <p className="text-xl text-foreground/80">
                Start Your Journey with ForSWAGs Today
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6 uppercase tracking-wide">Why You Should Join</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Guidance Navigating the Recruiting Journey</h4>
                    <p className="text-muted-foreground">Expert support every step of the way</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-secondary/10 rounded-lg flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Social Media Marketing</h4>
                    <p className="text-muted-foreground">Build your brand and get noticed</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Academic & Life Coaching</h4>
                    <p className="text-muted-foreground">Develop skills beyond the field</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-secondary/10 rounded-lg flex-shrink-0">
                    <Zap className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Access to the Playbook for Life</h4>
                    <p className="text-muted-foreground">Exclusive training and resources</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div>
            <Card className="p-8 bg-card/80 backdrop-blur border-2 border-primary/20">
              <h3 className="text-2xl font-bold mb-6 uppercase tracking-wide">Get Notified Early</h3>
              <p className="text-muted-foreground mb-6">
                This isn't the full application—just the basics to get you in line for early access and exclusive benefits.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter your full name"
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@example.com"
                    maxLength={255}
                  />
                </div>

                <div>
                  <Label htmlFor="sport">Sport</Label>
                  <Input
                    id="sport"
                    value={formData.sport}
                    onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                    placeholder="e.g., Basketball, Football"
                    maxLength={50}
                  />
                </div>

                <div>
                  <Label htmlFor="graduation_year">Graduation Year</Label>
                  <Input
                    id="graduation_year"
                    type="number"
                    value={formData.graduation_year}
                    onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                    placeholder="2025"
                    min="2024"
                    max="2035"
                  />
                </div>

                <div>
                  <Label htmlFor="high_school">High School</Label>
                  <Input
                    id="high_school"
                    value={formData.high_school}
                    onChange={(e) => setFormData({ ...formData, high_school: e.target.value })}
                    placeholder="School name"
                    maxLength={200}
                  />
                </div>

                <div>
                  <Label htmlFor="parent_email">Parent/Guardian Email (Optional)</Label>
                  <Input
                    id="parent_email"
                    type="email"
                    value={formData.parent_email}
                    onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                    placeholder="parent@example.com"
                    maxLength={255}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full btn-accent text-lg py-6"
                  disabled={loading}
                >
                  {loading ? "Joining..." : "Join The Waitlist"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
