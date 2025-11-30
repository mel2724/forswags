import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, PlayCircle, Award, TrendingUp, Heart, BookOpen, GraduationCap, ArrowLeft } from "lucide-react";
import { VideoPlaylist } from "@/components/VideoPlaylist";
import { CourseCard } from "@/components/CourseCard";
import { SEO } from "@/components/SEO";
import logoIcon from "@/assets/forswags-logo.png";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  is_published: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  video_count: number;
}

interface FavoriteVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration_minutes: number | null;
  module_id: string;
  module_title: string;
}

const PlaybookForLife = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "playbook";
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [playbookModules, setPlaybookModules] = useState<Module[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<FavoriteVideo[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    videosCompleted: 0,
    badgesEarned: 0,
    totalProgress: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  // Reload data when returning from a module view
  useEffect(() => {
    if (selectedModule === null) {
      loadData();
    }
  }, [selectedModule]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Load all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      // Find "Playbook for Life" course
      const playbookCourse = coursesData?.find(c => c.title.toLowerCase().includes("playbook"));
      
      if (playbookCourse) {
        // Load playbook modules
        const { data: modulesData, error: modulesError } = await supabase
          .from("modules")
          .select(`
            id,
            title,
            description,
            order_index,
            lessons!inner(id)
          `)
          .eq("course_id", playbookCourse.id)
          .order("order_index", { ascending: true });

        if (modulesError) throw modulesError;

        const formattedModules = modulesData?.map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          order_index: m.order_index,
          video_count: m.lessons?.length || 0,
        })) || [];

        setPlaybookModules(formattedModules);
      }

      // Load user stats if logged in
      if (user) {
        const { data: completions } = await supabase
          .from("video_completions")
          .select("id")
          .eq("user_id", user.id);

        const { data: badges } = await supabase
          .from("user_badges")
          .select("badge_id")
          .eq("user_id", user.id);

        const { data: enrollments } = await supabase
          .from("course_progress")
          .select("course_id")
          .eq("user_id", user.id);

        // Load favorite videos
        const { data: favorites } = await supabase
          .from("video_favorites")
          .select(`
            lesson_id,
            lessons!inner(
              id,
              title,
              description,
              video_url,
              duration_minutes,
              module_id,
              modules!inner(title)
            )
          `)
          .eq("user_id", user.id);

        const formattedFavorites = favorites?.map((f: any) => ({
          id: f.lessons.id,
          title: f.lessons.title,
          description: f.lessons.description,
          video_url: f.lessons.video_url,
          duration_minutes: f.lessons.duration_minutes,
          module_id: f.lessons.module_id,
          module_title: f.lessons.modules.title,
        })) || [];

        setFavoriteVideos(formattedFavorites);

        const totalVideos = playbookModules.reduce((sum, m) => sum + m.video_count, 0);
        const progress = totalVideos > 0 ? Math.round((completions?.length || 0) / totalVideos * 100) : 0;

        setStats({
          coursesEnrolled: new Set(enrollments?.map(e => e.course_id)).size,
          videosCompleted: completions?.length || 0,
          badgesEarned: badges?.length || 0,
          totalProgress: progress,
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load learning content");
    } finally {
      setLoading(false);
    }
  };

  const unfavoriteVideo = async (lessonId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("video_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId);

      if (error) throw error;

      // Update local state
      setFavoriteVideos(prev => prev.filter(v => v.id !== lessonId));
      toast.success("Removed from favorites");
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Failed to remove favorite");
    }
  };

  const filteredCourses = courses.filter(course =>
    !course.title.toLowerCase().includes("playbook") &&
    (course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     course.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading Playbook for Life...</p>
      </div>
    );
  }

  // If viewing a module's videos
  if (selectedModule) {
    const module = playbookModules.find(m => m.id === selectedModule);
    
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
              <img src={logoIcon} alt="ForSWAGs" className="h-12" />
            </div>
            
            <Button variant="ghost" onClick={() => setSelectedModule(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Playbook for Life
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Badge variant="outline" className="mb-2">The Playbook for Life</Badge>
            <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">
              {module?.title}
            </h1>
            {module?.description && (
              <p className="text-muted-foreground">{module.description}</p>
            )}
          </div>

          <VideoPlaylist moduleId={selectedModule} courseId={selectedModule} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sports-pattern">
      <SEO 
        title="Playbook for Life - Life Skills & Training Platform"
        description="Master life skills and athletic development with Playbook for Life. Access essential videos on focus, respect, finances, and more to excel on and off the field."
        keywords="life skills training, athlete development, playbook for life, character building, student athlete education, leadership training"
      />
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoIcon} alt="ForSWAGs" className="h-12" />
          </div>
          
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-primary hover:text-primary/80 font-bold">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-black mb-3 uppercase tracking-tight flex items-center justify-center gap-3">
            <GraduationCap className="h-12 w-12 text-primary" />
            Playbook for Life
          </h1>
          <p className="text-muted-foreground uppercase text-sm tracking-wider mb-8">
            Life skills videos • Character development • Earn badges • Track progress
          </p>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <p className="text-3xl font-bold">{stats.coursesEnrolled}</p>
                </div>
                <p className="text-sm text-muted-foreground">Courses Enrolled</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  <p className="text-3xl font-bold">{stats.videosCompleted}</p>
                </div>
                <p className="text-sm text-muted-foreground">Videos Completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-primary" />
                  <p className="text-3xl font-bold">{stats.badgesEarned}</p>
                </div>
                <p className="text-sm text-muted-foreground">Badges Earned</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <p className="text-3xl font-bold">{stats.totalProgress}%</p>
                </div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-8 bg-card/80 backdrop-blur border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search all learning content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue={defaultTab} onValueChange={(value) => setSearchParams({ tab: value })}>
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-8">
            <TabsTrigger value="playbook">Playbook for Life</TabsTrigger>
            <TabsTrigger value="courses">All Courses</TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="h-4 w-4" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="progress">My Progress</TabsTrigger>
          </TabsList>

          {/* Playbook for Life Tab */}
          <TabsContent value="playbook">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-black uppercase mb-2">The Playbook for Life</h2>
              <p className="text-muted-foreground">
                Essential life skills videos covering Focus, Respect, Finances, and more
              </p>
            </div>

            {playbookModules.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <PlayCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Topics Yet</h3>
                  <p className="text-muted-foreground">Video topics are being added. Check back soon!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {playbookModules.map((module) => (
                  <Card 
                    key={module.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
                    onClick={() => setSelectedModule(module.id)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between gap-2">
                        <span>{module.title}</span>
                        <Badge variant="secondary">{module.video_count}</Badge>
                      </CardTitle>
                      {module.description && (
                        <CardDescription>{module.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full gap-2">
                        <PlayCircle className="h-4 w-4" />
                        Watch Videos
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* All Courses Tab */}
          <TabsContent value="courses">
            {filteredCourses.length === 0 ? (
              <Card className="p-16 text-center bg-card/50 backdrop-blur border-2 border-primary/20">
                <BookOpen className="h-20 w-20 text-primary mx-auto mb-6" />
                <h2 className="text-3xl font-black uppercase mb-4">No Courses Found</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {searchTerm 
                    ? "Try adjusting your search to find courses"
                    : "Check back soon for new educational content"}
                </p>
                {searchTerm && (
                  <Button onClick={() => setSearchTerm("")}>Clear Search</Button>
                )}
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            {favoriteVideos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Favorites Yet</h3>
                  <p className="text-muted-foreground">
                    Click the heart icon on videos you love to save them here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteVideos.map((video) => (
                  <Card 
                    key={video.id}
                    className="hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="outline">{video.module_title}</Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            unfavoriteVideo(video.id);
                          }}
                        >
                          <Heart className="h-4 w-4 fill-red-500 text-red-500 hover:fill-transparent transition-all" />
                        </Button>
                      </div>
                      <CardTitle className="text-lg">{video.title}</CardTitle>
                      {video.description && (
                        <CardDescription className="line-clamp-2">{video.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        {video.duration_minutes && (
                          <span className="text-sm text-muted-foreground">{video.duration_minutes} min</span>
                        )}
                        <Button size="sm" onClick={() => setSelectedModule(video.module_id)} className="gap-2">
                          <PlayCircle className="h-4 w-4" />
                          Watch
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Progress Tab */}
          <TabsContent value="progress">
            <Card className="bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Video Learning Badges
                </CardTitle>
                <CardDescription>
                  Earn badges by watching videos and building life skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                    <p className="font-semibold">Video Learner</p>
                    <p className="text-sm text-muted-foreground">Complete 5 videos</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                    <p className="font-semibold">Life Skills Student</p>
                    <p className="text-sm text-muted-foreground">Complete 10 videos</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                    <p className="font-semibold">Playbook Graduate</p>
                    <p className="text-sm text-muted-foreground">Complete 25 videos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PlaybookForLife;
