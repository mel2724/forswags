import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Loader2, Mail, Phone, Award, User } from "lucide-react";

interface CoachProfile {
  id: string;
  user_id: string;
  full_name: string;
  bio: string | null;
  specializations: string[];
  certifications: string | null;
  experience_years: number | null;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  email?: string;
}

const AdminCoaches = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [filteredCoaches, setFilteredCoaches] = useState<CoachProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCoach, setSelectedCoach] = useState<CoachProfile | null>(null);

  useEffect(() => {
    fetchCoaches();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCoaches(coaches);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = coaches.filter(
        (coach) =>
          coach.full_name.toLowerCase().includes(query) ||
          coach.email?.toLowerCase().includes(query) ||
          coach.specializations.some((s) => s.toLowerCase().includes(query)) ||
          coach.certifications?.toLowerCase().includes(query)
      );
      setFilteredCoaches(filtered);
    }
  }, [searchQuery, coaches]);

  const fetchCoaches = async () => {
    try {
      const { data: coachData, error: coachError } = await supabase
        .from("coach_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (coachError) throw coachError;

      // Fetch emails from profiles table
      const userIds = coachData.map((c) => c.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      if (profileError) throw profileError;

      // Merge coach data with email
      const coachesWithEmail = coachData.map((coach) => ({
        ...coach,
        email: profileData.find((p) => p.id === coach.user_id)?.email,
      }));

      setCoaches(coachesWithEmail);
      setFilteredCoaches(coachesWithEmail);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCoachStatus = async (coachId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("coach_profiles")
        .update({ is_active: !currentStatus })
        .eq("id", coachId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Coach ${!currentStatus ? "activated" : "deactivated"} successfully.`,
      });

      fetchCoaches();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-500">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coaches Directory</h1>
        <p className="text-muted-foreground">
          View and manage all coach profiles
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Coaches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coaches.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Coaches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coaches.filter((c) => c.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactive Coaches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coaches.filter((c) => !c.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Coaches</CardTitle>
          <Input
            placeholder="Search by name, email, specialization, or certification..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Specializations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoaches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No coaches found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCoaches.map((coach) => (
                  <TableRow key={coach.id}>
                    <TableCell className="font-medium">{coach.full_name}</TableCell>
                    <TableCell>{coach.email || "N/A"}</TableCell>
                    <TableCell>
                      {coach.experience_years ? `${coach.experience_years} years` : "N/A"}
                    </TableCell>
                    <TableCell>
                      {coach.specializations.length > 0
                        ? coach.specializations.join(", ")
                        : "N/A"}
                    </TableCell>
                    <TableCell>{getStatusBadge(coach.is_active)}</TableCell>
                    <TableCell>
                      {new Date(coach.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCoach(coach)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant={coach.is_active ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleCoachStatus(coach.id, coach.is_active)}
                        >
                          {coach.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCoach} onOpenChange={() => setSelectedCoach(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Coach Profile Details</DialogTitle>
            <DialogDescription>
              View detailed information about this coach
            </DialogDescription>
          </DialogHeader>

          {selectedCoach && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                {selectedCoach.avatar_url ? (
                  <img
                    src={selectedCoach.avatar_url}
                    alt={selectedCoach.full_name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold">{selectedCoach.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedCoach.is_active)}
                    <span className="text-sm text-muted-foreground">
                      {selectedCoach.experience_years
                        ? `${selectedCoach.experience_years} years experience`
                        : "Experience not specified"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedCoach.email || "No email"}</span>
                </div>
              </div>

              {selectedCoach.bio && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Biography
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedCoach.bio}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Specializations</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCoach.specializations.length > 0 ? (
                    selectedCoach.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary">
                        {spec}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No specializations listed
                    </span>
                  )}
                </div>
              </div>

              {selectedCoach.certifications && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Certifications
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedCoach.certifications}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Member since: {new Date(selectedCoach.created_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  User ID: {selectedCoach.user_id}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoaches;
