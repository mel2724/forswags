import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScormUpload } from "@/components/ScormUpload";
import { CourseForm, CourseFormData } from "@/components/admin/CourseForm";
import { ModuleForm, ModuleFormData } from "@/components/admin/ModuleForm";
import { LessonForm, LessonFormData } from "@/components/admin/LessonForm";
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
  const [editingCourse, setEditingCourse] = useState(false);
  const [addingModule, setAddingModule] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [addingLesson, setAddingLesson] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingModule, setDeletingModule] = useState<string | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleUpdateCourse = async (data: CourseFormData) => {
    setIsSubmitting(true);
    try {
      const courseData = {
        title: data.title,
        description: data.description || null,
        duration_minutes: data.duration_minutes || null,
        thumbnail_url: data.thumbnail_url || null,
        is_published: data.is_published,
      };

      const { error } = await supabase
        .from("courses")
        .update(courseData)
        .eq("id", courseId);

      if (error) throw error;

      toast({ title: "Success", description: "Course updated successfully" });
      setEditingCourse(false);
      fetchCourseData();
    } catch (error) {
      console.error("Error updating course:", error);
      toast({ title: "Error", description: "Failed to update course", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddModule = async (data: ModuleFormData) => {
    setIsSubmitting(true);
    try {
      const moduleData = {
        title: data.title,
        description: data.description || null,
        order_index: data.order_index,
        course_id: courseId,
      };
      
      const { error } = await supabase
        .from("modules")
        .insert([moduleData]);

      if (error) throw error;

      toast({ title: "Success", description: "Module added successfully" });
      setAddingModule(false);
      fetchCourseData();
    } catch (error) {
      console.error("Error adding module:", error);
      toast({ title: "Error", description: "Failed to add module", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateModule = async (data: ModuleFormData) => {
    if (!editingModule) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("modules")
        .update(data)
        .eq("id", editingModule.id);

      if (error) throw error;

      toast({ title: "Success", description: "Module updated successfully" });
      setEditingModule(null);
      fetchCourseData();
    } catch (error) {
      console.error("Error updating module:", error);
      toast({ title: "Error", description: "Failed to update module", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!deletingModule) return;

    try {
      const { error } = await supabase
        .from("modules")
        .delete()
        .eq("id", deletingModule);

      if (error) throw error;

      toast({ title: "Success", description: "Module deleted successfully" });
      setDeletingModule(null);
      fetchCourseData();
    } catch (error) {
      console.error("Error deleting module:", error);
      toast({ title: "Error", description: "Failed to delete module", variant: "destructive" });
    }
  };

  const handleAddLesson = async (data: LessonFormData) => {
    if (!addingLesson) return;

    setIsSubmitting(true);
    try {
      const lessonData = {
        title: data.title,
        content: data.content || null,
        duration_minutes: data.duration_minutes || null,
        order_index: data.order_index,
        video_url: data.video_url || null,
        module_id: addingLesson,
        is_scorm_content: data.lesson_type === "scorm",
      };
      
      const { error } = await supabase
        .from("lessons")
        .insert([lessonData]);

      if (error) throw error;

      toast({ title: "Success", description: "Lesson added successfully" });
      setAddingLesson(null);
      fetchCourseData();
    } catch (error) {
      console.error("Error adding lesson:", error);
      toast({ title: "Error", description: "Failed to add lesson", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateLesson = async (data: LessonFormData) => {
    if (!editingLesson) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("lessons")
        .update(data)
        .eq("id", editingLesson.id);

      if (error) throw error;

      toast({ title: "Success", description: "Lesson updated successfully" });
      setEditingLesson(null);
      fetchCourseData();
    } catch (error) {
      console.error("Error updating lesson:", error);
      toast({ title: "Error", description: "Failed to update lesson", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!deletingLesson) return;

    try {
      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", deletingLesson);

      if (error) throw error;

      toast({ title: "Success", description: "Lesson deleted successfully" });
      setDeletingLesson(null);
      fetchCourseData();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast({ title: "Error", description: "Failed to delete lesson", variant: "destructive" });
    }
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
            <div className="flex gap-2 items-center">
              <Badge variant={course.is_published ? "default" : "secondary"}>
                {course.is_published ? "Published" : "Draft"}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => setEditingCourse(true)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit Course
              </Button>
            </div>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Content
              </CardTitle>
              <CardDescription>
                Modules, lessons, and SCORM packages for this course
              </CardDescription>
            </div>
            <Button onClick={() => setAddingModule(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </div>
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
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{module.title}</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setAddingLesson(module.id)}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add Lesson
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingModule(module)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeletingModule(module.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
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
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingLesson(lesson)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setDeletingLesson(lesson.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
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

      {/* Edit Course Dialog */}
      <Dialog open={editingCourse} onOpenChange={setEditingCourse}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>Update course information</DialogDescription>
          </DialogHeader>
          {course && (
            <CourseForm
              defaultValues={course}
              onSubmit={handleUpdateCourse}
              onCancel={() => setEditingCourse(false)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Module Dialog */}
      <Dialog open={addingModule} onOpenChange={setAddingModule}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Module</DialogTitle>
            <DialogDescription>Create a new module for this course</DialogDescription>
          </DialogHeader>
          <ModuleForm
            defaultValues={{ order_index: modules.length }}
            onSubmit={handleAddModule}
            onCancel={() => setAddingModule(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Module Dialog */}
      <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
            <DialogDescription>Update module information</DialogDescription>
          </DialogHeader>
          {editingModule && (
            <ModuleForm
              defaultValues={editingModule}
              onSubmit={handleUpdateModule}
              onCancel={() => setEditingModule(null)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Module Dialog */}
      <AlertDialog open={!!deletingModule} onOpenChange={(open) => !open && setDeletingModule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this module? This will also delete all lessons in this module. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModule} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Lesson Dialog */}
      <Dialog open={!!addingLesson} onOpenChange={(open) => !open && setAddingLesson(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Lesson</DialogTitle>
            <DialogDescription>Create a new lesson for this module</DialogDescription>
          </DialogHeader>
          {addingLesson && (
            <LessonForm
              defaultValues={{ 
                order_index: modules.find(m => m.id === addingLesson)?.lessons.length || 0 
              }}
              onSubmit={handleAddLesson}
              onCancel={() => setAddingLesson(null)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Lesson Dialog */}
      <Dialog open={!!editingLesson} onOpenChange={(open) => !open && setEditingLesson(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
            <DialogDescription>Update lesson information</DialogDescription>
          </DialogHeader>
          {editingLesson && (
            <LessonForm
              defaultValues={{
                title: editingLesson.title,
                content: editingLesson.content || "",
                lesson_type: editingLesson.is_scorm_content ? "scorm" : editingLesson.video_url ? "video" : "text",
                duration_minutes: editingLesson.duration_minutes,
                order_index: editingLesson.order_index,
                video_url: editingLesson.video_url,
              }}
              onSubmit={handleUpdateLesson}
              onCancel={() => setEditingLesson(null)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Lesson Dialog */}
      <AlertDialog open={!!deletingLesson} onOpenChange={(open) => !open && setDeletingLesson(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lesson? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLesson} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
