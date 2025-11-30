import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search, User, Users, GraduationCap, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  id: string;
  type: 'athlete' | 'coach' | 'school';
  title: string;
  subtitle?: string;
  url: string;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      await performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // Search athletes
      const { data: athletes } = await supabase
        .from("athletes")
        .select("id, user_id, sport, position, profiles!inner(full_name)")
        .ilike("profiles.full_name", `%${query}%`)
        .limit(5);

      if (athletes) {
        athletes.forEach((athlete: any) => {
          searchResults.push({
            id: athlete.id,
            type: 'athlete',
            title: athlete.profiles.full_name,
            subtitle: `${athlete.sport}${athlete.position ? ` • ${athlete.position}` : ''}`,
            url: `/players`,
          });
        });
      }

      // Search coaches
      const { data: coaches } = await supabase
        .from("coach_profiles")
        .select("id, full_name, specializations")
        .ilike("full_name", `%${query}%`)
        .eq("is_active", true)
        .limit(5);

      if (coaches) {
        coaches.forEach((coach) => {
          searchResults.push({
            id: coach.id,
            type: 'coach',
            title: coach.full_name,
            subtitle: coach.specializations?.join(", ") || "Coach",
            url: `/coach/view/${coach.id}`,
          });
        });
      }

      // Search schools
      const { data: schools } = await supabase
        .from("schools")
        .select("id, name, location_city, location_state, division")
        .or(`name.ilike.%${query}%,location_city.ilike.%${query}%,location_state.ilike.%${query}%`)
        .limit(5);

      if (schools) {
        schools.forEach((school) => {
          searchResults.push({
            id: school.id,
            type: 'school',
            title: school.name,
            subtitle: `${school.location_city}, ${school.location_state}${school.division ? ` • ${school.division}` : ''}`,
            url: `/schools`,
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: "Failed to search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'athlete':
        return <User className="h-4 w-4" />;
      case 'coach':
        return <Users className="h-4 w-4" />;
      case 'school':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const handleSelect = (url: string) => {
    onOpenChange(false);
    navigate(url);
    setSearchQuery("");
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search athletes, coaches, schools..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Searching..." : "No results found."}
        </CommandEmpty>

        {results.filter(r => r.type === 'athlete').length > 0 && (
          <CommandGroup heading="Athletes">
            {results.filter(r => r.type === 'athlete').map((result) => (
              <CommandItem
                key={result.id}
                value={result.title}
                onSelect={() => handleSelect(result.url)}
              >
                {getIcon(result.type)}
                <div className="ml-2">
                  <div className="font-medium">{result.title}</div>
                  {result.subtitle && (
                    <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.filter(r => r.type === 'coach').length > 0 && (
          <CommandGroup heading="Coaches">
            {results.filter(r => r.type === 'coach').map((result) => (
              <CommandItem
                key={result.id}
                value={result.title}
                onSelect={() => handleSelect(result.url)}
              >
                {getIcon(result.type)}
                <div className="ml-2">
                  <div className="font-medium">{result.title}</div>
                  {result.subtitle && (
                    <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.filter(r => r.type === 'school').length > 0 && (
          <CommandGroup heading="Schools">
            {results.filter(r => r.type === 'school').map((result) => (
              <CommandItem
                key={result.id}
                value={result.title}
                onSelect={() => handleSelect(result.url)}
              >
                {getIcon(result.type)}
                <div className="ml-2">
                  <div className="font-medium">{result.title}</div>
                  {result.subtitle && (
                    <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
