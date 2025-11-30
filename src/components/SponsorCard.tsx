import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  website_url: string;
}

export default function SponsorCard() {
  const [currentSponsor, setCurrentSponsor] = useState<Sponsor | null>(null);

  const { data: sponsors } = useQuery({
    queryKey: ["active-sponsors-card"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsors")
        .select("id, name, logo_url, website_url")
        .eq("is_active", true)
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      return data as Sponsor[];
    },
  });

  useEffect(() => {
    if (sponsors && sponsors.length > 0) {
      // Pick a random sponsor each time the component mounts
      const randomIndex = Math.floor(Math.random() * sponsors.length);
      setCurrentSponsor(sponsors[randomIndex]);
    }
  }, [sponsors]);

  if (!currentSponsor) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Featured Sponsor</CardTitle>
      </CardHeader>
      <CardContent>
        <a
          href={currentSponsor.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg mb-3 group-hover:bg-muted transition-colors">
            <img
              src={currentSponsor.logo_url}
              alt={currentSponsor.name}
              className="h-24 object-contain mb-3"
            />
            <p className="font-semibold text-center">{currentSponsor.name}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-primary group-hover:underline">
            Visit Website <ExternalLink className="h-3 w-3" />
          </div>
        </a>
      </CardContent>
    </Card>
  );
}
