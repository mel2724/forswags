import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Trophy, TrendingUp, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CourseStats {
  id: string;
  title: string;
  totalEnrolled: number;
  completedCount: number;
  avgProgress: number;
  isPublished: boolean;
}

interface RecentActivity {
  user_email: string;
  course_title: string;
  progress_percentage: number;
  updated_at: string;
}

export default function AdminPlaybookDashboard() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalEnrollments: 0,
    completionRate: 0,
  });
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch overall stats
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("id, title, is_published");

      if (coursesError) throw coursesError;

      const { data: progress, error: progressError } = await supabase
        .from("course_progress")
        .select("course_id, progress_percentage, completed_at");

      if (progressError) throw progressError;

      // Calculate overall stats
      const totalCourses = courses?.length || 0;
      const publishedCourses = courses?.filter((c) => c.is_published).length || 0;
      const totalEnrollments = progress?.length || 0;
      const completedEnrollments = progress?.filter((p) => p.completed_at).length || 0;
      const completionRate = totalEnrollments > 0 
        ? Math.round((completedEnrollments / totalEnrollments) * 100) 
        : 0;

      setStats({
        totalCourses,
        publishedCourses,
        totalEnrollments,
        completionRate,
      });

      // Calculate per-course stats
      const courseStatsMap: Record<string, CourseStats> = {};
      
      courses?.forEach((course) => {
        courseStatsMap[course.id] = {
          id: course.id,
          title: course.title,
          totalEnrolled: 0,
          completedCount: 0,
          avgProgress: 0,
          isPublished: course.is_published,
        };
      });

      progress?.forEach((p) => {
        if (courseStatsMap[p.course_id]) {
          courseStatsMap[p.course_id].totalEnrolled++;
          if (p.completed_at) {
            courseStatsMap[p.course_id].completedCount++;
          }
        }
      });

      // Calculate average progress per course
      Object.keys(courseStatsMap).forEach((courseId) => {
        const courseProgress = progress?.filter((p) => p.course_id === courseId) || [];
        const totalProgress = courseProgress.reduce((sum, p) => sum + (p.progress_percentage || 0), 0);
        courseStatsMap[courseId].avgProgress = 
          courseProgress.length > 0 ? Math.round(totalProgress / courseProgress.length) : 0;
      });

      setCourseStats(Object.values(courseStatsMap).sort((a, b) => b.totalEnrolled - a.totalEnrolled));

      // Fetch recent activity
      const { data: recentData, error: recentError } = await supabase
        .from("course_progress")
        .select(`
          progress_percentage,
          updated_at,
          user_id,
          course_id,
          courses!inner(title)
        `)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (recentError) throw recentError;

      // Fetch user emails for recent activity
      if (recentData && recentData.length > 0) {
        const userIds = [...new Set(recentData.map((r: any) => r.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p.email]) || []);

        const formattedActivity: RecentActivity[] = recentData.map((r: any) => ({
          user_email: profileMap.get(r.user_id) || "Unknown",
          course_title: r.courses.title,
          progress_percentage: r.progress_percentage,
          updated_at: r.updated_at,
        }));

        setRecentActivity(formattedActivity);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Playbook for Life Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of course activity, enrollments, and completion statistics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedCourses} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Overall completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courseStats.length > 0
                ? Math.round(
                    courseStats.reduce((sum, c) => sum + c.avgProgress, 0) / courseStats.length
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Across active courses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Course Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Course Statistics</CardTitle>
          <CardDescription>
            Enrollment and completion data for each course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Avg. Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No course data available
                    </TableCell>
                  </TableRow>
                ) : (
                  courseStats.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>
                        <Badge variant={course.isPublished ? "default" : "secondary"}>
                          {course.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>{course.totalEnrolled}</TableCell>
                      <TableCell>
                        {course.completedCount} (
                        {course.totalEnrolled > 0
                          ? Math.round((course.completedCount / course.totalEnrolled) * 100)
                          : 0}
                        %)
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={course.avgProgress} className="w-20" />
                          <span className="text-sm">{course.avgProgress}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest course progress updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No recent activity
                    </TableCell>
                  </TableRow>
                ) : (
                  recentActivity.map((activity, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{activity.user_email}</TableCell>
                      <TableCell>{activity.course_title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={activity.progress_percentage} className="w-20" />
                          <span className="text-sm">{activity.progress_percentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {new Date(activity.updated_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
