import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScormUpload } from "@/components/ScormUpload";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Upload, Eye, Edit, Trash2, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  duration_minutes: number | null;
  order_index: number;
  is_scorm_content: boolean;
  scorm_package_url: string | null;
  video_url: string | null;
  module_id: string;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  lessons: Lesson[];
}

export default function AdminCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [showScormUpload, setShowScormUpload] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch modules with lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select(`
          id,
          title,
          description,
          order_index,
          lessons (
            id,
            title,
            content,
            duration_minutes,
            order_index,
            is_scorm_content,
            scorm_package_url,
            video_url,
            module_id
          )
        `)
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (modulesError) throw modulesError;

      const formattedModules = modulesData.map((module: any) => ({
        ...module,
        lessons: (module.lessons || []).sort((a: Lesson, b: Lesson) => a.order_index - b.order_index),
      }));

      setModules(formattedModules);
    } catch (error) {
      console.error("Error fetching course data:", error);
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScormUploadComplete = () => {
    setShowScormUpload(false);
    setSelectedLesson(null);
    fetchCourseData();
    toast({
      title: "Success",
      description: "SCORM package uploaded successfully",
    });
  };

  if (loading) {
    return <div className="p-8">Loading course...</div>;
  }

  if (!course) {
    return <div className="p-8">Course not found</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/courses")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
      </div>

      {/* Course Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              <CardDescription>{course.description || "No description"}</CardDescription>
            </div>
            <Badge variant={course.is_published ? "default" : "secondary"}>
              {course.is_published ? "Published" : "Draft"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Duration:</span>{" "}
              <span className="font-medium">
                {course.duration_minutes ? `${course.duration_minutes} minutes` : "Not set"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>{" "}
              <span className="font-medium">{new Date(course.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules and Lessons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Content
          </CardTitle>
          <CardDescription>
            Modules, lessons, and SCORM packages for this course
          </CardDescription>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No modules found for this course
            </div>
          ) : (
            <div className="space-y-6">
              {modules.map((module) => (
                <div key={module.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">{module.title}</h3>
                  {module.description && (
                    <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                  )}

                  {module.lessons.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic">No lessons in this module</div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Lesson Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {module.lessons.map((lesson) => (
                            <TableRow key={lesson.id}>
                              <TableCell>{lesson.order_index}</TableCell>
                              <TableCell className="font-medium">{lesson.title}</TableCell>
                              <TableCell>
                                {lesson.is_scorm_content ? (
                                  <Badge variant="secondary">SCORM</Badge>
                                ) : lesson.video_url ? (
                                  <Badge variant="outline">Video</Badge>
                                ) : (
                                  <Badge variant="outline">Text</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {lesson.duration_minutes ? `${lesson.duration_minutes} min` : "N/A"}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Dialog open={showScormUpload && selectedLesson === lesson.id}>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedLesson(lesson.id);
                                          setShowScormUpload(true);
                                        }}
                                      >
                                        <Upload className="h-3 w-3 mr-1" />
                                        SCORM
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>Upload SCORM Package</DialogTitle>
                                        <DialogDescription>
                                          Upload a SCORM package for: {lesson.title}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <ScormUpload
                                        lessonId={lesson.id}
                                        onUploadComplete={handleScormUploadComplete}
                                      />
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setShowScormUpload(false);
                                          setSelectedLesson(null);
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.id}`)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
