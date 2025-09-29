import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import logoIcon from "@/assets/forswags-logo.png";
import { ArrowLeft, BookOpen, Clock, PlayCircle, CheckCircle2, Lock } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  order_index: number;
}

const CourseDetail = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      // Load course
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Load modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (modulesError) throw modulesError;

      // Load lessons for each module
      const modulesWithLessons = await Promise.all(
        (modulesData || []).map(async (module) => {
          const { data: lessonsData } = await supabase
            .from("lessons")
            .select("*")
            .eq("module_id", module.id)
            .order("order_index", { ascending: true });

          return {
            ...module,
            lessons: lessonsData || [],
          };
        })
      );

      setModules(modulesWithLessons);
    } catch (error: any) {
      toast.error("Failed to load course");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0);
  const totalDuration = modules.reduce(
    (acc, module) => 
      acc + module.lessons.reduce((sum, lesson) => sum + (lesson.duration_minutes || 0), 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Course Not Found</h2>
          <Button onClick={() => navigate("/courses")}>
            Back to Courses
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sports-pattern">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoIcon} alt="ForSWAGs" className="h-12" />
          </div>
          
          <Button variant="ghost" onClick={() => navigate("/courses")} className="text-primary hover:text-primary/80 font-bold">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Playbook
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Course Header */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-5xl font-black mb-3 uppercase tracking-tight">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-muted-foreground text-lg">
                  {course.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>{totalLessons} Lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>{totalDuration} minutes</span>
              </div>
            </div>
          </div>

          {course.thumbnail_url && (
            <Card className="lg:col-span-1 overflow-hidden">
              <img 
                src={course.thumbnail_url} 
                alt={course.title}
                className="w-full h-48 object-cover"
              />
            </Card>
          )}
        </div>

        {/* Course Content */}
        <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="uppercase tracking-tight">Course Content</CardTitle>
            <CardDescription>
              {modules.length} modules • {totalLessons} lessons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {modules.map((module, moduleIndex) => (
                <AccordionItem key={module.id} value={module.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {moduleIndex + 1}
                        </Badge>
                        <span className="font-bold text-left">{module.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {module.lessons.length} lessons
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {module.description && (
                      <p className="text-sm text-muted-foreground mb-4 pl-12">
                        {module.description}
                      </p>
                    )}
                    <div className="space-y-2 pl-12">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
                          onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.id}`)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <PlayCircle className="h-5 w-5 text-primary" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate">
                                {lessonIndex + 1}. {lesson.title}
                              </h4>
                              {lesson.duration_minutes && (
                                <p className="text-xs text-muted-foreground">
                                  {lesson.duration_minutes} min
                                </p>
                              )}
                            </div>
                          </div>
                          <Button size="sm" variant="ghost">
                            Start
                          </Button>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CourseDetail;
