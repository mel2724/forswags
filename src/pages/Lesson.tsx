import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import logoIcon from "@/assets/forswags-logo.png";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, FileArchive } from "lucide-react";
import { ScormPlayer } from "@/components/ScormPlayer";
import { ScormUploader } from "@/components/ScormUploader";

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  order_index: number;
  scorm_package_url: string | null;
  scorm_version: string | null;
  is_scorm_content: boolean | null;
}

interface Module {
  id: string;
  title: string;
  course_id: string;
}

const LessonViewer = () => {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    if (lessonId) {
      loadLesson();
      checkAdminStatus();
    }
  }, [lessonId]);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      setIsAdmin(roleData?.role === "admin");
    } catch (error) {
      console.error("Failed to check admin status:", error);
    }
  };

  const loadLesson = async () => {
    try {
      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        setIsAdmin(!!roleData);
      }

      // Load lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lessonId)
        .single();

      if (lessonError) throw lessonError;
      setLesson(lessonData);

      // Load module
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("*")
        .eq("id", lessonData.module_id)
        .single();

      if (moduleError) throw moduleError;
      setModule(moduleData);

      // Load all lessons in the module
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", lessonData.module_id)
        .order("order_index", { ascending: true });

      if (lessonsError) throw lessonsError;
      setAllLessons(lessonsData || []);
    } catch (error: any) {
      toast.error("Failed to load lesson");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const markAsComplete = async () => {
    toast.success("Lesson marked as complete!");
    if (nextLesson) {
      navigate(`/courses/${courseId}/lessons/${nextLesson.id}`);
    } else {
      navigate(`/courses/${courseId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading lesson...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Lesson Not Found</h2>
          <Button onClick={() => navigate(`/courses/${courseId}`)}>
            Back to Course
          </Button>
        </Card>
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
          
          <Button variant="ghost" onClick={() => navigate(`/courses/${courseId}`)} className="text-primary hover:text-primary/80 font-bold">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Lesson Header */}
        <div className="mb-6">
          <Badge variant="outline" className="mb-2">
            {module?.title}
          </Badge>
          <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">
            {lesson.title}
          </h1>
          {lesson.duration_minutes && (
            <p className="text-sm text-muted-foreground">
              Estimated time: {lesson.duration_minutes} minutes
            </p>
          )}
        </div>

        {/* SCORM Content */}
        {lesson.is_scorm_content && lesson.scorm_package_url && lesson.scorm_version && (
          <div className="mb-6">
            <ScormPlayer
              lessonId={lesson.id}
              scormPackageUrl={lesson.scorm_package_url}
              scormVersion={lesson.scorm_version as "1.2" | "2004"}
            />
          </div>
        )}

        {/* Regular Video Player */}
        {!lesson.is_scorm_content && lesson.video_url && (
          <Card className="mb-6 overflow-hidden bg-card/80 backdrop-blur border-2 border-primary/20">
            <div className="aspect-video bg-muted">
              <iframe
                src={lesson.video_url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </Card>
        )}

        {/* Admin SCORM Upload */}
        {isAdmin && !lesson.is_scorm_content && (
          <div className="mb-6">
            {!showUploader ? (
              <Button 
                variant="outline" 
                onClick={() => setShowUploader(true)}
                className="w-full"
              >
                <FileArchive className="h-4 w-4 mr-2" />
                Upload SCORM Package
              </Button>
            ) : (
              <ScormUpload
                lessonId={lessonId!}
                onUploadComplete={() => {
                  setShowUploader(false);
                  loadLesson();
                }}
              />
            )}
          </div>
        )}

        {/* Lesson Content */}
        {!lesson.is_scorm_content && lesson.content && (
          <Card className="mb-6 bg-card/80 backdrop-blur border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Lesson Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {lesson.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => previousLesson && navigate(`/courses/${courseId}/lessons/${previousLesson.id}`)}
            disabled={!previousLesson}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Lesson
          </Button>

          <Button onClick={markAsComplete} className="gap-2">
            {nextLesson ? (
              <>
                Complete & Continue
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Complete Course
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default LessonViewer;
