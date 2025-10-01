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
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/src/assets/logo-icon.png" alt="ForSwags" className="h-8 w-8" />
            <span className="text-xl font-bold text-gradient-primary">ForSwags</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" onClick={() => navigate("/")}>Home</Button>
            <Button variant="ghost" onClick={() => navigate("/sponsors")}>Become a Sponsor</Button>
            <Button variant="ghost" onClick={() => navigate("/auth")}>Sign In</Button>
          </nav>
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

      <footer className="border-t py-12 px-4 bg-muted/50">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <img src="/src/assets/logo-icon.png" alt="ForSwags" className="h-8 w-8" />
              <span className="text-xl font-bold text-gradient-primary">ForSwags</span>
            </div>
            <div className="text-center md:text-right text-sm text-muted-foreground">
              <p>© 2025 ForSwags. All rights reserved.</p>
              <p className="mt-2">Building futures beyond the game.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
