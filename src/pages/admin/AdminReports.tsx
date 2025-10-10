import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Filter, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function AdminReports() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  
  // Athletes filters
  const [athletesData, setAthletesData] = useState<any[]>([]);
  const [athleteFilters, setAthleteFilters] = useState({
    sport: "",
    state: "",
    graduationYear: "",
    hasEvaluation: "",
    visibility: "",
  });

  // Evaluations filters
  const [evaluationsData, setEvaluationsData] = useState<any[]>([]);
  const [evaluationFilters, setEvaluationFilters] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
    isReevaluation: "",
  });

  // Coaches filters
  const [coachesData, setCoachesData] = useState<any[]>([]);
  const [coachFilters, setCoachFilters] = useState({
    isActive: "",
    specialization: "",
  });

  // Recruiters filters
  const [recruitersData, setRecruitersData] = useState<any[]>([]);

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAthletes(),
        fetchEvaluations(),
        fetchCoaches(),
        fetchRecruiters(),
      ]);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAthletes = async () => {
    let query = supabase
      .from("athletes")
      .select(`
        id,
        sport,
        position,
        high_school,
        graduation_year,
        gpa,
        visibility,
        created_at,
        user_id,
        evaluations(id, status)
      `)
      .order("created_at", { ascending: false });

    if (athleteFilters.sport) {
      query = query.eq("sport", athleteFilters.sport);
    }
    if (athleteFilters.graduationYear) {
      query = query.eq("graduation_year", parseInt(athleteFilters.graduationYear));
    }
    if (athleteFilters.visibility) {
      query = query.eq("visibility", athleteFilters.visibility);
    }

    const { data, error } = await query;
    if (error) throw error;

    let filteredData = data || [];
    
    if (athleteFilters.hasEvaluation === "yes") {
      filteredData = filteredData.filter((a: any) => a.evaluations?.length > 0);
    } else if (athleteFilters.hasEvaluation === "no") {
      filteredData = filteredData.filter((a: any) => !a.evaluations || a.evaluations.length === 0);
    }

    // Fetch profile data separately
    const userIds = filteredData.map((a: any) => a.user_id).filter(Boolean);
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      // Join profiles data
      filteredData = filteredData.map((athlete: any) => ({
        ...athlete,
        profiles: profilesData?.find((p: any) => p.id === athlete.user_id),
      }));
    }

    setAthletesData(filteredData);
  };

  const fetchEvaluations = async () => {
    let query = supabase
      .from("evaluations")
      .select(`
        id,
        status,
        is_reevaluation,
        purchased_at,
        completed_at,
        athlete_id,
        coach_id
      `)
      .order("purchased_at", { ascending: false });

    if (evaluationFilters.status) {
      query = query.eq("status", evaluationFilters.status as any);
    }
    if (evaluationFilters.isReevaluation) {
      query = query.eq("is_reevaluation", evaluationFilters.isReevaluation === "yes");
    }
    if (evaluationFilters.dateFrom) {
      query = query.gte("purchased_at", evaluationFilters.dateFrom);
    }
    if (evaluationFilters.dateTo) {
      query = query.lte("purchased_at", evaluationFilters.dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;

    let evaluationsData = data || [];

    // Fetch related athlete and coach data
    const athleteIds = evaluationsData.map((e: any) => e.athlete_id).filter(Boolean);
    const coachIds = evaluationsData.map((e: any) => e.coach_id).filter(Boolean);

    const [athletesRes, coachesRes] = await Promise.all([
      athleteIds.length > 0
        ? supabase
            .from("athletes")
            .select("id, sport, graduation_year, user_id")
            .in("id", athleteIds)
        : Promise.resolve({ data: [] }),
      coachIds.length > 0
        ? supabase
            .from("coach_profiles")
            .select("user_id, full_name")
            .in("user_id", coachIds)
        : Promise.resolve({ data: [] }),
    ]);

    // Fetch profile data for athletes
    const userIds = athletesRes.data?.map((a: any) => a.user_id).filter(Boolean) || [];
    const { data: profilesData } = userIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
      : { data: [] };

    // Join all data
    evaluationsData = evaluationsData.map((evaluation: any) => {
      const athlete = athletesRes.data?.find((a: any) => a.id === evaluation.athlete_id);
      const profile = athlete ? profilesData?.find((p: any) => p.id === athlete.user_id) : null;
      const coach = coachesRes.data?.find((c: any) => c.user_id === evaluation.coach_id);

      return {
        ...evaluation,
        athletes: athlete
          ? {
              ...athlete,
              profiles: profile,
            }
          : null,
        coach_profiles: coach,
      };
    });

    setEvaluationsData(evaluationsData);
  };

  const fetchCoaches = async () => {
    let query = supabase
      .from("coach_profiles")
      .select(`
        id,
        full_name,
        is_active,
        specializations,
        experience_years,
        user_id,
        evaluations(id, status)
      `)
      .order("full_name");

    if (coachFilters.isActive) {
      query = query.eq("is_active", coachFilters.isActive === "yes");
    }

    const { data, error } = await query;
    if (error) throw error;

    let filteredData = data || [];
    
    if (coachFilters.specialization) {
      filteredData = filteredData.filter((c: any) => 
        c.specializations?.includes(coachFilters.specialization)
      );
    }

    setCoachesData(filteredData);
  };

  const fetchRecruiters = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "recruiter");

    if (error) throw error;

    // Fetch profile data separately
    const userIds = data?.map((r: any) => r.user_id).filter(Boolean) || [];
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .in("id", userIds);

      const recruitersWithProfiles = data?.map((recruiter: any) => ({
        ...recruiter,
        profiles: profilesData?.find((p: any) => p.id === recruiter.user_id),
      }));

      setRecruitersData(recruitersWithProfiles || []);
    } else {
      setRecruitersData([]);
    }
  };

  const exportToCSV = (data: any[], filename: string, columns: string[]) => {
    setExportingData(true);
    try {
      const headers = columns.join(",");
      const rows = data.map((item) =>
        columns.map((col) => {
          const value = col.split(".").reduce((obj, key) => obj?.[key], item);
          return `"${value || ""}"`;
        }).join(",")
      );
      
      const csv = [headers, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Downloaded ${filename}.csv`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setExportingData(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Platform Reports</h1>
          <p className="text-muted-foreground">
            Generate and export comprehensive reports
          </p>
        </div>
      </div>

      <Tabs defaultValue="athletes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="athletes">Athletes ({athletesData.length})</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations ({evaluationsData.length})</TabsTrigger>
          <TabsTrigger value="coaches">Coaches ({coachesData.length})</TabsTrigger>
          <TabsTrigger value="recruiters">Recruiters ({recruitersData.length})</TabsTrigger>
        </TabsList>

        {/* Athletes Tab */}
        <TabsContent value="athletes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Athlete Reports</CardTitle>
                  <CardDescription>Filter and export athlete data</CardDescription>
                </div>
                <Button
                  onClick={() =>
                    exportToCSV(
                      athletesData,
                      "athletes",
                      ["profiles.full_name", "profiles.email", "sport", "position", "high_school", "graduation_year", "gpa", "visibility"]
                    )
                  }
                  disabled={exportingData || athletesData.length === 0}
                >
                  {exportingData ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  value={athleteFilters.sport || "all"}
                  onValueChange={(value) => {
                    setAthleteFilters({ ...athleteFilters, sport: value === "all" ? "" : value });
                    fetchAthletes();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sports</SelectItem>
                    <SelectItem value="Basketball">Basketball</SelectItem>
                    <SelectItem value="Football">Football</SelectItem>
                    <SelectItem value="Soccer">Soccer</SelectItem>
                    <SelectItem value="Baseball">Baseball</SelectItem>
                    <SelectItem value="Softball">Softball</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  placeholder="Graduation Year"
                  value={athleteFilters.graduationYear}
                  onChange={(e) => {
                    setAthleteFilters({ ...athleteFilters, graduationYear: e.target.value });
                    fetchAthletes();
                  }}
                />

                <Select
                  value={athleteFilters.hasEvaluation || "all"}
                  onValueChange={(value) => {
                    setAthleteFilters({ ...athleteFilters, hasEvaluation: value === "all" ? "" : value });
                    fetchAthletes();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Evaluation Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Has Evaluation</SelectItem>
                    <SelectItem value="no">No Evaluation</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={athleteFilters.visibility || "all"}
                  onValueChange={(value) => {
                    setAthleteFilters({ ...athleteFilters, visibility: value === "all" ? "" : value });
                    fetchAthletes();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
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
                      <TableHead>Evaluations</TableHead>
                      <TableHead>Visibility</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {athletesData.map((athlete: any) => (
                      <TableRow key={athlete.id}>
                        <TableCell>{athlete.profiles?.full_name || "N/A"}</TableCell>
                        <TableCell>{athlete.profiles?.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{athlete.sport}</Badge>
                        </TableCell>
                        <TableCell>{athlete.position || "N/A"}</TableCell>
                        <TableCell>{athlete.high_school || "N/A"}</TableCell>
                        <TableCell>{athlete.graduation_year || "N/A"}</TableCell>
                        <TableCell>{athlete.gpa ? athlete.gpa.toFixed(2) : "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={athlete.evaluations?.length > 0 ? "default" : "secondary"}>
                            {athlete.evaluations?.length || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={athlete.visibility === "public" ? "default" : "secondary"}>
                            {athlete.visibility}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evaluations Tab */}
        <TabsContent value="evaluations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Evaluation Reports</CardTitle>
                  <CardDescription>Filter and export evaluation data</CardDescription>
                </div>
                <Button
                  onClick={() =>
                    exportToCSV(
                      evaluationsData,
                      "evaluations",
                      ["athletes.profiles.full_name", "athletes.sport", "status", "is_reevaluation", "purchased_at", "completed_at", "coach_profiles.full_name"]
                    )
                  }
                  disabled={exportingData || evaluationsData.length === 0}
                >
                  {exportingData ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select
                  value={evaluationFilters.status || "all"}
                  onValueChange={(value) => {
                    setEvaluationFilters({ ...evaluationFilters, status: value === "all" ? "" : value });
                    fetchEvaluations();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={evaluationFilters.isReevaluation || "all"}
                  onValueChange={(value) => {
                    setEvaluationFilters({ ...evaluationFilters, isReevaluation: value === "all" ? "" : value });
                    fetchEvaluations();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Evaluation Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="no">Initial</SelectItem>
                    <SelectItem value="yes">Re-evaluation</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  placeholder="From Date"
                  value={evaluationFilters.dateFrom}
                  onChange={(e) => {
                    setEvaluationFilters({ ...evaluationFilters, dateFrom: e.target.value });
                    fetchEvaluations();
                  }}
                />

                <Input
                  type="date"
                  placeholder="To Date"
                  value={evaluationFilters.dateTo}
                  onChange={(e) => {
                    setEvaluationFilters({ ...evaluationFilters, dateTo: e.target.value });
                    fetchEvaluations();
                  }}
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Athlete</TableHead>
                      <TableHead>Sport</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Coach</TableHead>
                      <TableHead>Purchased</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluationsData.map((evaluation: any) => (
                      <TableRow key={evaluation.id}>
                        <TableCell>{evaluation.athletes?.profiles?.full_name || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{evaluation.athletes?.sport}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              evaluation.status === "completed"
                                ? "default"
                                : evaluation.status === "in_progress"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {evaluation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {evaluation.is_reevaluation ? (
                            <Badge variant="secondary">Re-eval</Badge>
                          ) : (
                            <Badge variant="outline">Initial</Badge>
                          )}
                        </TableCell>
                        <TableCell>{evaluation.coach_profiles?.full_name || "Unassigned"}</TableCell>
                        <TableCell>{new Date(evaluation.purchased_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {evaluation.completed_at
                            ? new Date(evaluation.completed_at).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coaches Tab */}
        <TabsContent value="coaches" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Coach Reports</CardTitle>
                  <CardDescription>Filter and export coach data</CardDescription>
                </div>
                <Button
                  onClick={() =>
                    exportToCSV(
                      coachesData,
                      "coaches",
                      ["full_name", "is_active", "experience_years", "specializations"]
                    )
                  }
                  disabled={exportingData || coachesData.length === 0}
                >
                  {exportingData ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  value={coachFilters.isActive || "all"}
                  onValueChange={(value) => {
                    setCoachFilters({ ...coachFilters, isActive: value === "all" ? "" : value });
                    fetchCoaches();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Active Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Coaches</SelectItem>
                    <SelectItem value="yes">Active</SelectItem>
                    <SelectItem value="no">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Filter by Specialization"
                  value={coachFilters.specialization}
                  onChange={(e) => {
                    setCoachFilters({ ...coachFilters, specialization: e.target.value });
                    fetchCoaches();
                  }}
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Specializations</TableHead>
                      <TableHead>Total Evaluations</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coachesData.map((coach: any) => (
                      <TableRow key={coach.id}>
                        <TableCell>{coach.full_name}</TableCell>
                        <TableCell>
                          <Badge variant={coach.is_active ? "default" : "secondary"}>
                            {coach.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{coach.experience_years || "N/A"} years</TableCell>
                        <TableCell>
                          {coach.specializations?.join(", ") || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge>{coach.evaluations?.length || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {coach.evaluations?.filter((e: any) => e.status === "completed").length || 0}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recruiters Tab */}
        <TabsContent value="recruiters" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Recruiter Reports</CardTitle>
                  <CardDescription>View and export recruiter data</CardDescription>
                </div>
                <Button
                  onClick={() =>
                    exportToCSV(
                      recruitersData,
                      "recruiters",
                      ["profiles.full_name", "profiles.email", "profiles.created_at"]
                    )
                  }
                  disabled={exportingData || recruitersData.length === 0}
                >
                  {exportingData ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recruitersData.map((recruiter: any) => (
                      <TableRow key={recruiter.user_id}>
                        <TableCell>{recruiter.profiles?.full_name || "N/A"}</TableCell>
                        <TableCell>{recruiter.profiles?.email}</TableCell>
                        <TableCell>
                          {recruiter.profiles?.created_at
                            ? new Date(recruiter.profiles.created_at).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
