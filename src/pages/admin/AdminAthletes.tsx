import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Athlete {
  id: string;
  sport: string;
  position: string | null;
  high_school: string | null;
  graduation_year: number | null;
  gpa: number | null;
  created_at: string;
  profiles?: {
    email: string;
    full_name: string | null;
  };
}

export default function AdminAthletes() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAthletes();
  }, []);

  const fetchAthletes = async () => {
    try {
      const { data, error } = await supabase
        .from("athletes")
        .select(`
          *,
          profiles (
            email,
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAthletes(data as any || []);
    } catch (error) {
      console.error("Error fetching athletes:", error);
      toast({
        title: "Error",
        description: "Failed to load athletes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAthletes = athletes.filter(
    (athlete) =>
      athlete.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.high_school?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div>Loading athletes...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Athlete Management</h1>
        <p className="text-muted-foreground">
          View and manage athlete profiles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Athletes</CardTitle>
          <CardDescription>
            Total athletes: {athletes.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search athletes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>GPA</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAthletes.map((athlete) => (
                  <TableRow key={athlete.id}>
                    <TableCell className="font-medium">
                      {athlete.profiles?.full_name || "N/A"}
                    </TableCell>
                    <TableCell>{athlete.profiles?.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{athlete.sport}</Badge>
                    </TableCell>
                    <TableCell>{athlete.position || "N/A"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {athlete.high_school || "N/A"}
                    </TableCell>
                    <TableCell>{athlete.graduation_year || "N/A"}</TableCell>
                    <TableCell>
                      {athlete.gpa ? athlete.gpa.toFixed(2) : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/profile/${athlete.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
