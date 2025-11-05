import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlayCircle, Award, TrendingUp } from "lucide-react";
import { VideoPlaylist } from "@/components/VideoPlaylist";
import logoIcon from "@/assets/forswags-logo.png";
import { toast } from "sonner";

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  video_count: number;
}

const PlaybookForLife = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVideos: 0,
    completedVideos: 0,
    badgesEarned: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Find "Playbook for Life" course
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("id")
        .ilike("title", "%playbook%")
        .single();

      if (courseError) {
        // Create the course if it doesn't exist
        const { data: newCourse, error: createError } = await supabase
          .from("courses")
          .insert({
            title: "The Playbook for Life",
            description: "Essential life skills videos for athletes - covering Focus, Respect, Finances, Friendships, and more",
            is_published: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        
        toast.success("Playbook for Life course created!");
        loadData();
        return;
      }

      // Load modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select(`
          id,
          title,
          description,
          order_index,
          lessons!inner(id)
        `)
        .eq("course_id", course.id)
        .order("order_index", { ascending: true });

      if (modulesError) throw modulesError;

      const formattedModules = modulesData.map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        order_index: m.order_index,
        video_count: m.lessons?.length || 0,
      }));

      setModules(formattedModules);

      // Load user stats
      if (user) {
        const { data: completions } = await supabase
          .from("video_completions")
          .select("id")
          .eq("user_id", user.id);

        const { data: badges } = await supabase
          .from("user_badges")
          .select("badge_id")
          .eq("user_id", user.id)
          .in("badge_id", 
            await supabase
              .from("badges")
              .select("id")
              .in("name", ["Video Learner", "Life Skills Student", "Playbook Graduate"])
              .then(res => res.data?.map(b => b.id) || [])
          );

        const totalVideos = formattedModules.reduce((sum, m) => sum + m.video_count, 0);

        setStats({
          totalVideos,
          completedVideos: completions?.length || 0,
          badgesEarned: badges?.length || 0,
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load Playbook for Life");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading Playbook for Life...</p>
      </div>
    );
  }

  if (selectedModule) {
    const module = modules.find(m => m.id === selectedModule);
    
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
              <img src={logoIcon} alt="ForSWAGs" className="h-12" />
            </div>
            
            <Button variant="ghost" onClick={() => setSelectedModule(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Topics
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoIcon} alt="ForSWAGs" className="h-12" />
          </div>
          
          <Button variant="ghost" onClick={() => navigate("/courses")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Courses
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-black mb-4 uppercase tracking-tight">
            The Playbook for Life
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Essential life skills videos for athletes. Learn about Focus, Respect, Finances, 
            Friendships, and more. Watch videos to earn badges and boost your life skills score.
          </p>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  <p className="text-3xl font-bold">{stats.completedVideos}/{stats.totalVideos}</p>
                </div>
                <p className="text-sm text-muted-foreground">Videos Completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-primary" />
                  <p className="text-3xl font-bold">{stats.badgesEarned}/3</p>
                </div>
                <p className="text-sm text-muted-foreground">Badges Earned</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <p className="text-3xl font-bold">
                    {stats.totalVideos > 0 ? Math.round((stats.completedVideos / stats.totalVideos) * 100) : 0}%
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">Progress</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Life Skills Topics</h2>
          
          {modules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <PlayCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Topics Yet</h3>
                <p className="text-muted-foreground">
                  Video topics are being added. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
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
        </div>

        {/* Badge Milestones */}
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
      </main>
    </div>
  );
};

export default PlaybookForLife;