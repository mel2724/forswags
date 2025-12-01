import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  website_url: string;
  tier: string;
  description: string | null;
}

export default function SponsorShowcase() {
  const navigate = useNavigate();

  const { data: sponsors, isLoading } = useQuery({
    queryKey: ["active-sponsors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsors")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      return data as Sponsor[];
    },
  });

  const tierGroups = {
    platinum: sponsors?.filter(s => s.tier === "platinum") || [],
    gold: sponsors?.filter(s => s.tier === "gold") || [],
    silver: sponsors?.filter(s => s.tier === "silver") || [],
    community: sponsors?.filter(s => s.tier === "community") || [],
  };

  const tierInfo = {
    platinum: { title: "Platinum Partners", color: "text-slate-400" },
    gold: { title: "Gold Partners", color: "text-yellow-600" },
    silver: { title: "Silver Partners", color: "text-slate-500" },
    community: { title: "Community Partners", color: "text-primary" },
  };

  return (
    <div className="min-h-screen bg-background">
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
            <Button variant="ghost" onClick={() => navigate("/sponsors")} className="text-primary hover:text-primary/80 font-bold">
              Become a Sponsor
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

      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient-primary">
              Our Sponsors
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Thank you to our amazing sponsors who make it possible to keep ForSwags affordable and accessible to all student athletes
            </p>
            <Button size="lg" onClick={() => navigate("/sponsors")}>
              Become a Sponsor
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading sponsors...</p>
            </div>
          ) : !sponsors?.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No sponsors yet. Be the first to support our mission!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-16">
              {Object.entries(tierGroups).map(([tier, sponsorList]) => {
                if (!sponsorList.length) return null;
                const info = tierInfo[tier as keyof typeof tierInfo];
                
                return (
                  <div key={tier}>
                    <h2 className={`text-3xl font-bold mb-8 text-center ${info.color}`}>
                      {info.title}
                    </h2>
                    <div className={`grid gap-8 ${
                      tier === "platinum" ? "md:grid-cols-2" :
                      tier === "gold" ? "md:grid-cols-3" :
                      "md:grid-cols-4"
                    }`}>
                      {sponsorList.map((sponsor) => (
                        <Card key={sponsor.id} className="group hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-4">
                            <div className="flex justify-center mb-4">
                              <img
                                src={sponsor.logo_url}
                                alt={sponsor.name}
                                className={`object-contain ${
                                  tier === "platinum" ? "h-32" :
                                  tier === "gold" ? "h-24" :
                                  "h-20"
                                }`}
                              />
                            </div>
                            <CardTitle className="text-center">{sponsor.name}</CardTitle>
                            {sponsor.description && (
                              <CardDescription className="text-center">
                                {sponsor.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="text-center">
                            <a
                              href={sponsor.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-primary hover:underline"
                            >
                              Visit Website <ExternalLink className="h-4 w-4" />
                            </a>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Our Sponsor Family
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Help us empower the next generation of student athletes with essential life skills beyond the game
          </p>
          <Button size="lg" onClick={() => navigate("/sponsors")}>
            Learn About Sponsorship Opportunities
          </Button>
        </div>
      </section>

      <footer className="relative bg-gradient-to-b from-background to-card py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6">
            <img src="/forswags-logo.png" alt="ForSWAGs" className="h-20 mx-auto" />
            
            <div className="max-w-3xl mx-auto">
              <p className="text-xs text-muted-foreground leading-relaxed border-l-4 border-secondary pl-4 text-left">
                ForSWAGs is an athletic development and Prime Dime matching platform. 
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
}
