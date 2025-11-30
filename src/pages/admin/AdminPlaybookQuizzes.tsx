import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/AdminSidebar";

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  video_url: string | null;
  quiz: Quiz | null;
}

interface Quiz {
  id: string;
  title: string;
  passing_score: number;
  questions: Question[];
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  order_index: number;
  explanation: string | null;
}

const AdminPlaybookQuizzes = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuiz, setEditingQuiz] = useState<{ lessonId: string; quiz: Partial<Quiz> } | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<{ quizId: string; question: Partial<Question> } | null>(null);

  useEffect(() => {
    loadPlaybookData();
  }, []);

  const loadPlaybookData = async () => {
    try {
      setLoading(true);

      // Find Playbook for Life course
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .ilike("title", "%playbook%")
        .limit(1);

      if (!courses || courses.length === 0) {
        toast.error("Playbook for Life course not found");
        return;
      }

      const playbookCourseId = courses[0].id;

      // Load modules with lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select(`
          id,
          title,
          lessons (
            id,
            title,
            video_url,
            lesson_quizzes (
              id,
              title,
              passing_score,
              questions (
                id,
                question_text,
                options,
                correct_answer,
                order_index,
                explanation
              )
            )
          )
        `)
        .eq("course_id", playbookCourseId)
        .order("order_index");

      if (modulesError) throw modulesError;

      const formattedModules = (modulesData || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        lessons: (m.lessons || [])
          .filter((l: any) => l.video_url) // Only show lessons with videos
          .map((l: any) => ({
            id: l.id,
            title: l.title,
            video_url: l.video_url,
            quiz: l.lesson_quizzes && l.lesson_quizzes.length > 0 ? {
              id: l.lesson_quizzes[0].id,
              title: l.lesson_quizzes[0].title,
              passing_score: l.lesson_quizzes[0].passing_score,
              questions: (l.lesson_quizzes[0].questions || []).map((q: any) => ({
                ...q,
                options: Array.isArray(q.options) ? q.options as string[] : []
              }))
            } : null
          }))
      }));

      setModules(formattedModules);
    } catch (error) {
      console.error("Error loading playbook data:", error);
      toast.error("Failed to load playbook data");
    } finally {
      setLoading(false);
    }
  };

  const saveQuiz = async (lessonId: string, quizData: Partial<Quiz>) => {
    try {
      if (quizData.id) {
        // Update existing quiz
        const { error } = await supabase
          .from("lesson_quizzes")
          .update({
            title: quizData.title,
            passing_score: quizData.passing_score
          })
          .eq("id", quizData.id);

        if (error) throw error;
        toast.success("Quiz updated");
      } else {
        // Create new quiz
        const { error } = await supabase
          .from("lesson_quizzes")
          .insert({
            lesson_id: lessonId,
            title: quizData.title || "Knowledge Check",
            passing_score: quizData.passing_score || 70
          });

        if (error) throw error;
        toast.success("Quiz created");
      }

      setEditingQuiz(null);
      loadPlaybookData();
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast.error("Failed to save quiz");
    }
  };

  const deleteQuiz = async (quizId: string) => {
    if (!confirm("Delete this quiz and all its questions?")) return;

    try {
      const { error } = await supabase
        .from("lesson_quizzes")
        .delete()
        .eq("id", quizId);

      if (error) throw error;
      toast.success("Quiz deleted");
      loadPlaybookData();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz");
    }
  };

  const saveQuestion = async (quizId: string, questionData: Partial<Question>) => {
    try {
      if (questionData.id) {
        // Update existing question
        const { error } = await supabase
          .from("questions")
          .update({
            question_text: questionData.question_text,
            options: questionData.options,
            correct_answer: questionData.correct_answer,
            explanation: questionData.explanation
          })
          .eq("id", questionData.id);

        if (error) throw error;
        toast.success("Question updated");
      } else {
        // Get max order_index
        const { data: existingQuestions } = await supabase
          .from("questions")
          .select("order_index")
          .eq("quiz_id", quizId)
          .order("order_index", { ascending: false })
          .limit(1);

        const nextOrderIndex = existingQuestions && existingQuestions.length > 0 
          ? existingQuestions[0].order_index + 1 
          : 0;

        // Create new question
        const { error } = await supabase
          .from("questions")
          .insert({
            quiz_id: quizId,
            question_text: questionData.question_text,
            options: questionData.options,
            correct_answer: questionData.correct_answer,
            explanation: questionData.explanation,
            order_index: nextOrderIndex
          });

        if (error) throw error;
        toast.success("Question added");
      }

      setEditingQuestion(null);
      loadPlaybookData();
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Failed to save question");
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm("Delete this question?")) return;

    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;
      toast.success("Question deleted");
      loadPlaybookData();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Playbook Quiz Management</h1>
            <p className="text-muted-foreground">
              Create and manage knowledge check questions for Playbook for Life videos
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {modules.map((module) => (
              <AccordionItem key={module.id} value={module.id} className="border rounded-lg">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{module.title}</span>
                    <Badge variant="secondary">{module.lessons.length} videos</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="space-y-4">
                    {module.lessons.map((lesson) => (
                      <Card key={lesson.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{lesson.title}</CardTitle>
                              {lesson.quiz ? (
                                <CardDescription>
                                  Quiz: {lesson.quiz.questions.length} questions · {lesson.quiz.passing_score}% to pass
                                </CardDescription>
                              ) : (
                                <CardDescription className="text-orange-600">
                                  No quiz configured
                                </CardDescription>
                              )}
                            </div>
                            <Dialog open={editingQuiz?.lessonId === lesson.id} onOpenChange={(open) => !open && setEditingQuiz(null)}>
                              <DialogTrigger asChild>
                                <Button
                                  variant={lesson.quiz ? "outline" : "default"}
                                  size="sm"
                                  onClick={() => setEditingQuiz({
                                    lessonId: lesson.id,
                                    quiz: lesson.quiz || { title: "Knowledge Check", passing_score: 70 }
                                  })}
                                >
                                  {lesson.quiz ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                  {lesson.quiz ? "Edit Quiz" : "Create Quiz"}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Quiz Settings</DialogTitle>
                                  <DialogDescription>Configure the quiz for this video</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Quiz Title</Label>
                                    <Input
                                      value={editingQuiz?.quiz.title || ""}
                                      onChange={(e) => setEditingQuiz(prev => prev ? {
                                        ...prev,
                                        quiz: { ...prev.quiz, title: e.target.value }
                                      } : null)}
                                      placeholder="e.g., Knowledge Check"
                                    />
                                  </div>
                                  <div>
                                    <Label>Passing Score (%)</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={editingQuiz?.quiz.passing_score || 70}
                                      onChange={(e) => setEditingQuiz(prev => prev ? {
                                        ...prev,
                                        quiz: { ...prev.quiz, passing_score: parseInt(e.target.value) }
                                      } : null)}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button onClick={() => saveQuiz(lesson.id, editingQuiz!.quiz)}>
                                      <Save className="h-4 w-4 mr-2" />
                                      Save Quiz
                                    </Button>
                                    {lesson.quiz && (
                                      <Button variant="destructive" onClick={() => deleteQuiz(lesson.quiz!.id)}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Quiz
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardHeader>

                        {lesson.quiz && (
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">Questions</h4>
                                <Dialog open={editingQuestion?.quizId === lesson.quiz.id && !editingQuestion.question.id} onOpenChange={(open) => !open && setEditingQuestion(null)}>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      onClick={() => setEditingQuestion({
                                        quizId: lesson.quiz!.id,
                                        question: { question_text: "", options: ["", "", "", ""], correct_answer: "", order_index: 0 }
                                      })}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Question
                                    </Button>
                                  </DialogTrigger>
                                  <QuestionDialog
                                    question={editingQuestion?.question}
                                    onSave={(q) => saveQuestion(lesson.quiz!.id, q)}
                                    onClose={() => setEditingQuestion(null)}
                                  />
                                </Dialog>
                              </div>

                              {lesson.quiz.questions.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4">No questions yet. Add one to get started.</p>
                              ) : (
                                <div className="space-y-3">
                                  {lesson.quiz.questions.map((question, idx) => (
                                    <Card key={question.id} className="bg-muted/50">
                                      <CardContent className="pt-4">
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="flex-1 space-y-2">
                                            <p className="font-medium">{idx + 1}. {question.question_text}</p>
                                            <div className="space-y-1 text-sm">
                                              {question.options.map((opt, i) => (
                                                <div key={i} className={opt === question.correct_answer ? "text-green-600 font-medium" : "text-muted-foreground"}>
                                                  {String.fromCharCode(65 + i)}. {opt}
                                                  {opt === question.correct_answer && " ✓"}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            <Dialog open={editingQuestion?.question.id === question.id} onOpenChange={(open) => !open && setEditingQuestion(null)}>
                                              <DialogTrigger asChild>
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  onClick={() => setEditingQuestion({
                                                    quizId: lesson.quiz!.id,
                                                    question: question
                                                  })}
                                                >
                                                  <Edit className="h-4 w-4" />
                                                </Button>
                                              </DialogTrigger>
                                              <QuestionDialog
                                                question={editingQuestion?.question}
                                                onSave={(q) => saveQuestion(lesson.quiz!.id, q)}
                                                onClose={() => setEditingQuestion(null)}
                                              />
                                            </Dialog>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              onClick={() => deleteQuestion(question.id)}
                                            >
                                              <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

const QuestionDialog = ({ 
  question, 
  onSave, 
  onClose 
}: { 
  question?: Partial<Question>; 
  onSave: (q: Partial<Question>) => void; 
  onClose: () => void;
}) => {
  const [editedQuestion, setEditedQuestion] = useState<Partial<Question>>(
    question || { question_text: "", options: ["", "", "", ""], correct_answer: "", explanation: "", order_index: 0 }
  );

  useEffect(() => {
    if (question) {
      setEditedQuestion(question);
    }
  }, [question]);

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(editedQuestion.options || ["", "", "", ""])];
    newOptions[index] = value;
    setEditedQuestion({ ...editedQuestion, options: newOptions });
  };

  const canSave = editedQuestion.question_text && 
    editedQuestion.options?.every(o => o.trim()) && 
    editedQuestion.correct_answer;

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{question?.id ? "Edit Question" : "Add Question"}</DialogTitle>
        <DialogDescription>Create a multiple choice question</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Question</Label>
          <Textarea
            value={editedQuestion.question_text || ""}
            onChange={(e) => setEditedQuestion({ ...editedQuestion, question_text: e.target.value })}
            placeholder="Enter your question..."
            rows={3}
          />
        </div>

        <div className="space-y-3">
          <Label>Answer Options</Label>
          {(editedQuestion.options || ["", "", "", ""]).map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="font-medium w-8">{String.fromCharCode(65 + index)}.</span>
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
              />
            </div>
          ))}
        </div>

        <div>
          <Label>Correct Answer</Label>
          <select
            className="w-full p-2 border rounded-md"
            value={editedQuestion.correct_answer || ""}
            onChange={(e) => setEditedQuestion({ ...editedQuestion, correct_answer: e.target.value })}
          >
            <option value="">Select correct answer...</option>
            {(editedQuestion.options || []).map((option, index) => (
              option && <option key={index} value={option}>{String.fromCharCode(65 + index)}. {option}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>Explanation (Optional)</Label>
          <Textarea
            value={editedQuestion.explanation || ""}
            onChange={(e) => setEditedQuestion({ ...editedQuestion, explanation: e.target.value })}
            placeholder="Explain why this is the correct answer..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            This will be shown to students after they submit their answers
          </p>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={() => onSave(editedQuestion)} disabled={!canSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Question
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};

export default AdminPlaybookQuizzes;
