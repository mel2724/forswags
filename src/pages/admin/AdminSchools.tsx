import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface School {
  id: string;
  name: string;
  division: string | null;
  conference: string | null;
  location_city: string | null;
  location_state: string | null;
  enrollment: number | null;
  tuition: number | null;
  created_at: string;
}

export default function AdminSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error("Error fetching schools:", error);
      toast({
        title: "Error",
        description: "Failed to load schools",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = schools.filter(
    (school) =>
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.location_city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.location_state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.conference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div>Loading schools...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">School Management</h1>
        <p className="text-muted-foreground">
          Manage college and university partners
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schools</CardTitle>
          <CardDescription>
            Total schools: {schools.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools..."
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
                  <TableHead>Location</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Conference</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Tuition</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {school.location_city}, {school.location_state}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {school.division ? (
                        <Badge variant="outline">{school.division}</Badge>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {school.conference || "N/A"}
                    </TableCell>
                    <TableCell>
                      {school.enrollment?.toLocaleString() || "N/A"}
                    </TableCell>
                    <TableCell>
                      {school.tuition
                        ? `$${school.tuition.toLocaleString()}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {new Date(school.created_at).toLocaleDateString()}
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
