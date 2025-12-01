import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, BookOpen, GraduationCap, ArrowLeft } from "lucide-react";
import { CourseCard } from "@/components/CourseCard";
import { SEO } from "@/components/SEO";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  is_published: boolean;
}

const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      toast.error("Failed to load courses");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sports-pattern">
      <SEO 
        title="Playbook for Life - Life Skills Training Courses"
        description="Master life skills with our comprehensive training courses for student-athletes. Learn leadership, character development, and essential skills beyond athletics."
        keywords="athlete training courses, life skills, leadership development, character training, student athlete education, sports development courses"
      />
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/forswags-logo.png" alt="ForSWAGs" className="h-12" />
          </div>
          
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-primary hover:text-primary/80 font-bold">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-5xl font-black mb-3 uppercase tracking-tight flex items-center gap-3">
            <GraduationCap className="h-12 w-12 text-primary" />
            Playbook for Life
          </h1>
          <p className="text-muted-foreground uppercase text-sm tracking-wider">
            Master the game on and off the field • {filteredCourses.length} Courses Available
          </p>
        </div>

        {/* Search */}
        <Card className="mb-8 bg-card/80 backdrop-blur border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <Card className="p-16 text-center bg-card/50 backdrop-blur border-2 border-primary/20">
            <BookOpen className="h-20 w-20 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-black uppercase mb-4">No Playbook Courses Found</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {searchTerm 
                ? "Try adjusting your search to find courses"
                : "Check back soon for new educational content"}
            </p>
            {searchTerm && (
              <Button onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Courses;
