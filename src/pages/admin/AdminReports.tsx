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

  // Courses & Learning filters
  const [coursesData, setCoursesData] = useState<any[]>([]);
  const [courseFilters, setCourseFilters] = useState({
    courseId: "",
    dateFrom: "",
    dateTo: "",
    reportType: "overview", // overview, completion, engagement, bookmarks, dropoff
  });

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
        fetchCourses(),
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

  const fetchCourses = async () => {
    try {
      // Fetch courses with progress data
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select(`
          id,
          title,
          description,
          is_published,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;

      // Fetch all course progress
      let progressQuery = supabase
        .from("course_progress")
        .select(`
          id,
          user_id,
          course_id,
          progress_percentage,
          started_at,
          completed_at,
          completed_lessons
        `);

      if (courseFilters.dateFrom) {
        progressQuery = progressQuery.gte("started_at", courseFilters.dateFrom);
      }
      if (courseFilters.dateTo) {
        progressQuery = progressQuery.lte("started_at", courseFilters.dateTo);
      }

      const { data: progressData, error: progressError } = await progressQuery;
      if (progressError) throw progressError;

      // Fetch bookmarks
      const { data: bookmarksData } = await supabase
        .from("course_bookmarks")
        .select("id, user_id, lesson_id, created_at");

      // Fetch modules and lessons for detailed reports
      const { data: modulesData } = await supabase
        .from("modules")
        .select(`
          id,
          course_id,
          title,
          order_index
        `);

      const { data: lessonsData } = await supabase
        .from("lessons")
        .select(`
          id,
          module_id,
          title,
          duration_minutes,
          order_index
        `);

      // Calculate statistics for each course
      const coursesWithStats = (courses || []).map((course: any) => {
        const courseProgress = progressData?.filter((p: any) => p.course_id === course.id) || [];
        const courseModules = modulesData?.filter((m: any) => m.course_id === course.id) || [];
        const courseLessonIds = courseModules.flatMap((m: any) =>
          (lessonsData || []).filter((l: any) => l.module_id === m.id).map((l: any) => l.id)
        );
        const courseBookmarks = bookmarksData?.filter((b: any) =>
          courseLessonIds.includes(b.lesson_id)
        ) || [];

        const enrolledCount = courseProgress.length;
        const completedCount = courseProgress.filter((p: any) => p.completed_at).length;
        const inProgressCount = courseProgress.filter((p: any) => !p.completed_at && p.progress_percentage > 0).length;
        const avgProgress = enrolledCount > 0
          ? courseProgress.reduce((sum: number, p: any) => sum + (p.progress_percentage || 0), 0) / enrolledCount
          : 0;
        
        const completedProgress = courseProgress.filter((p: any) => p.completed_at);
        const avgCompletionTime = completedProgress.length > 0
          ? completedProgress.reduce((sum: number, p: any) => {
              const start = new Date(p.started_at).getTime();
              const end = new Date(p.completed_at).getTime();
              return sum + (end - start);
            }, 0) / completedProgress.length / (1000 * 60 * 60 * 24) // Convert to days
          : 0;

        return {
          ...course,
          stats: {
            enrolledCount,
            completedCount,
            inProgressCount,
            completionRate: enrolledCount > 0 ? (completedCount / enrolledCount) * 100 : 0,
            avgProgress: avgProgress.toFixed(1),
            avgCompletionDays: avgCompletionTime.toFixed(1),
            bookmarksCount: courseBookmarks.length,
            modulesCount: courseModules.length,
            lessonsCount: courseLessonIds.length,
          },
          progress: courseProgress,
          modules: courseModules,
          lessons: lessonsData?.filter((l: any) =>
            courseModules.some((m: any) => m.id === l.module_id)
          ),
          bookmarks: courseBookmarks,
        };
      });

      // Filter by specific course if selected
      let filteredData = coursesWithStats;
      if (courseFilters.courseId) {
        filteredData = coursesWithStats.filter((c: any) => c.id === courseFilters.courseId);
      }

      setCoursesData(filteredData);
    } catch (error) {
      console.error("Error fetching courses:", error);
      throw error;
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="athletes">Athletes ({athletesData.length})</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations ({evaluationsData.length})</TabsTrigger>
          <TabsTrigger value="courses">Courses ({coursesData.length})</TabsTrigger>
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

        {/* Courses & Learning Tab */}
        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Playbook for Life - Course Reports</CardTitle>
                  <CardDescription>Analyze course engagement, completion rates, and learning patterns</CardDescription>
                </div>
                <Button
                  onClick={() =>
                    exportToCSV(
                      coursesData,
                      "courses_report",
                      ["title", "stats.enrolledCount", "stats.completedCount", "stats.completionRate", "stats.avgProgress", "stats.avgCompletionDays", "stats.modulesCount", "stats.lessonsCount"]
                    )
                  }
                  disabled={exportingData || coursesData.length === 0}
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
                  value={courseFilters.courseId || "all"}
                  onValueChange={(value) => {
                    setCourseFilters({ ...courseFilters, courseId: value === "all" ? "" : value });
                    fetchCourses();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {coursesData.map((course: any) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={courseFilters.reportType}
                  onValueChange={(value) => {
                    setCourseFilters({ ...courseFilters, reportType: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Report Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="completion">Completion Details</SelectItem>
                    <SelectItem value="engagement">Engagement Metrics</SelectItem>
                    <SelectItem value="bookmarks">Bookmark Analysis</SelectItem>
                    <SelectItem value="lessons">Lesson Performance</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  placeholder="From Date"
                  value={courseFilters.dateFrom}
                  onChange={(e) => {
                    setCourseFilters({ ...courseFilters, dateFrom: e.target.value });
                    fetchCourses();
                  }}
                />

                <Input
                  type="date"
                  placeholder="To Date"
                  value={courseFilters.dateTo}
                  onChange={(e) => {
                    setCourseFilters({ ...courseFilters, dateTo: e.target.value });
                    fetchCourses();
                  }}
                />
              </div>

              {/* Overview Report */}
              {courseFilters.reportType === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {coursesData.reduce((sum, c) => sum + (c.stats?.enrolledCount || 0), 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {coursesData.reduce((sum, c) => sum + (c.stats?.completedCount || 0), 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Avg Completion Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {coursesData.length > 0
                            ? (coursesData.reduce((sum, c) => sum + (c.stats?.completionRate || 0), 0) / coursesData.length).toFixed(1)
                            : 0}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Bookmarks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {coursesData.reduce((sum, c) => sum + (c.stats?.bookmarksCount || 0), 0)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course Title</TableHead>
                          <TableHead>Published</TableHead>
                          <TableHead>Modules</TableHead>
                          <TableHead>Lessons</TableHead>
                          <TableHead>Enrolled</TableHead>
                          <TableHead>In Progress</TableHead>
                          <TableHead>Completed</TableHead>
                          <TableHead>Completion Rate</TableHead>
                          <TableHead>Avg Progress</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coursesData.map((course: any) => (
                          <TableRow key={course.id}>
                            <TableCell className="font-medium">{course.title}</TableCell>
                            <TableCell>
                              <Badge variant={course.is_published ? "default" : "secondary"}>
                                {course.is_published ? "Yes" : "No"}
                              </Badge>
                            </TableCell>
                            <TableCell>{course.stats.modulesCount}</TableCell>
                            <TableCell>{course.stats.lessonsCount}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{course.stats.enrolledCount}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{course.stats.inProgressCount}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">{course.stats.completedCount}</Badge>
                            </TableCell>
                            <TableCell>{course.stats.completionRate.toFixed(1)}%</TableCell>
                            <TableCell>{course.stats.avgProgress}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Completion Details Report */}
              {courseFilters.reportType === "completion" && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course Title</TableHead>
                        <TableHead>Total Enrolled</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Completion Rate</TableHead>
                        <TableHead>Avg Time to Complete</TableHead>
                        <TableHead>Fastest Completion</TableHead>
                        <TableHead>Slowest Completion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coursesData.map((course: any) => {
                        const completedProgress = course.progress?.filter((p: any) => p.completed_at) || [];
                        const completionTimes = completedProgress.map((p: any) => {
                          const start = new Date(p.started_at).getTime();
                          const end = new Date(p.completed_at).getTime();
                          return (end - start) / (1000 * 60 * 60 * 24); // days
                        });
                        const fastest = completionTimes.length > 0 ? Math.min(...completionTimes) : 0;
                        const slowest = completionTimes.length > 0 ? Math.max(...completionTimes) : 0;

                        return (
                          <TableRow key={course.id}>
                            <TableCell className="font-medium">{course.title}</TableCell>
                            <TableCell>{course.stats.enrolledCount}</TableCell>
                            <TableCell>{course.stats.completedCount}</TableCell>
                            <TableCell>
                              <Badge variant={course.stats.completionRate > 50 ? "default" : "secondary"}>
                                {course.stats.completionRate.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>{course.stats.avgCompletionDays} days</TableCell>
                            <TableCell>{fastest > 0 ? fastest.toFixed(1) : "N/A"} days</TableCell>
                            <TableCell>{slowest > 0 ? slowest.toFixed(1) : "N/A"} days</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Engagement Metrics Report */}
              {courseFilters.reportType === "engagement" && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course Title</TableHead>
                        <TableHead>Active Learners</TableHead>
                        <TableHead>Engagement Rate</TableHead>
                        <TableHead>Avg Progress</TableHead>
                        <TableHead>Bookmarks</TableHead>
                        <TableHead>Started This Month</TableHead>
                        <TableHead>Completed This Month</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coursesData.map((course: any) => {
                        const thisMonth = new Date();
                        thisMonth.setDate(1);
                        const startedThisMonth = course.progress?.filter((p: any) =>
                          new Date(p.started_at) >= thisMonth
                        ).length || 0;
                        const completedThisMonth = course.progress?.filter((p: any) =>
                          p.completed_at && new Date(p.completed_at) >= thisMonth
                        ).length || 0;
                        const activeLearners = course.stats.enrolledCount - course.stats.completedCount;
                        const engagementRate = course.stats.enrolledCount > 0
                          ? ((course.stats.inProgressCount + course.stats.completedCount) / course.stats.enrolledCount) * 100
                          : 0;

                        return (
                          <TableRow key={course.id}>
                            <TableCell className="font-medium">{course.title}</TableCell>
                            <TableCell>{activeLearners}</TableCell>
                            <TableCell>
                              <Badge variant={engagementRate > 70 ? "default" : "secondary"}>
                                {engagementRate.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>{course.stats.avgProgress}%</TableCell>
                            <TableCell>{course.stats.bookmarksCount}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{startedThisMonth}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">{completedThisMonth}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Bookmark Analysis Report */}
              {courseFilters.reportType === "bookmarks" && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course Title</TableHead>
                        <TableHead>Total Bookmarks</TableHead>
                        <TableHead>Unique Users</TableHead>
                        <TableHead>Avg Bookmarks per User</TableHead>
                        <TableHead>Most Bookmarked Lesson</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coursesData.map((course: any) => {
                        const uniqueUsers = new Set(course.bookmarks?.map((b: any) => b.user_id) || []).size;
                        const avgBookmarks = uniqueUsers > 0 ? (course.stats.bookmarksCount / uniqueUsers).toFixed(1) : 0;
                        
                        // Find most bookmarked lesson
                        const lessonBookmarkCounts = course.bookmarks?.reduce((acc: any, b: any) => {
                          acc[b.lesson_id] = (acc[b.lesson_id] || 0) + 1;
                          return acc;
                        }, {}) || {};
                        const mostBookmarkedLessonId = Object.keys(lessonBookmarkCounts).reduce((a, b) =>
                          lessonBookmarkCounts[a] > lessonBookmarkCounts[b] ? a : b, null
                        );
                        const mostBookmarkedLesson = course.lessons?.find((l: any) => l.id === mostBookmarkedLessonId);

                        return (
                          <TableRow key={course.id}>
                            <TableCell className="font-medium">{course.title}</TableCell>
                            <TableCell>{course.stats.bookmarksCount}</TableCell>
                            <TableCell>{uniqueUsers}</TableCell>
                            <TableCell>{avgBookmarks}</TableCell>
                            <TableCell>
                              {mostBookmarkedLesson ? (
                                <div className="space-y-1">
                                  <div className="text-sm">{mostBookmarkedLesson.title}</div>
                                  <Badge variant="outline">{lessonBookmarkCounts[mostBookmarkedLessonId]} bookmarks</Badge>
                                </div>
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Lesson Performance Report */}
              {courseFilters.reportType === "lessons" && (
                <div className="space-y-4">
                  {coursesData.map((course: any) => (
                    <Card key={course.id}>
                      <CardHeader>
                        <CardTitle>{course.title}</CardTitle>
                        <CardDescription>{course.stats.lessonsCount} lessons across {course.stats.modulesCount} modules</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Module</TableHead>
                                <TableHead>Lesson</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Completion Count</TableHead>
                                <TableHead>Bookmarks</TableHead>
                                <TableHead>Type</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {course.modules?.map((module: any) => {
                                const moduleLessons = course.lessons?.filter((l: any) => l.module_id === module.id) || [];
                                return moduleLessons.map((lesson: any, idx: number) => {
                                  const lessonCompletions = course.progress?.filter((p: any) =>
                                    p.completed_lessons?.includes(lesson.id)
                                  ).length || 0;
                                  const lessonBookmarks = course.bookmarks?.filter((b: any) =>
                                    b.lesson_id === lesson.id
                                  ).length || 0;

                                  return (
                                    <TableRow key={lesson.id}>
                                      {idx === 0 && (
                                        <TableCell rowSpan={moduleLessons.length} className="font-medium">
                                          {module.title}
                                        </TableCell>
                                      )}
                                      <TableCell>{lesson.title}</TableCell>
                                      <TableCell>{lesson.duration_minutes ? `${lesson.duration_minutes} min` : "N/A"}</TableCell>
                                      <TableCell>
                                        <Badge variant="outline">{lessonCompletions}</Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="secondary">{lessonBookmarks}</Badge>
                                      </TableCell>
                                      <TableCell>
                                        {lesson.is_scorm_content ? (
                                          <Badge>SCORM</Badge>
                                        ) : lesson.video_url ? (
                                          <Badge variant="outline">Video</Badge>
                                        ) : (
                                          <Badge variant="secondary">Text</Badge>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                });
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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
