import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertCircle, Trophy } from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  order_index: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  passing_score: number;
}

interface LessonQuizProps {
  lessonId: string;
  onComplete?: (passed: boolean, score: number) => void;
}

const LessonQuiz = ({ lessonId, onComplete }: LessonQuizProps) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [previousAttempts, setPreviousAttempts] = useState<any[]>([]);

  useEffect(() => {
    loadQuiz();
    loadPreviousAttempts();
  }, [lessonId]);

  const loadQuiz = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from("lesson_quizzes")
        .select("*")
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (quizError) throw quizError;
      if (!quizData) {
        setLoading(false);
        return;
      }

      setQuiz(quizData);

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizData.id)
        .order("order_index", { ascending: true });

      if (questionsError) throw questionsError;
      
      const formattedQuestions = (questionsData || []).map(q => ({
        id: q.id,
        question: q.question_text,
        options: (q.options as any as string[]) || [],
        correct_answer: q.correct_answer,
        order_index: q.order_index
      }));
      
      setQuestions(formattedQuestions);
    } catch (error) {
      console.error("Error loading quiz:", error);
      toast.error("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const loadPreviousAttempts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: quizData } = await supabase
        .from("lesson_quizzes")
        .select("id")
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (!quizData) return;

      const { data: attemptsData } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", quizData.id)
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

      setPreviousAttempts(attemptsData || []);
    } catch (error) {
      console.error("Error loading previous attempts:", error);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error("Please answer all questions");
      return;
    }

    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / questions.length) * 100);
    const passed = finalScore >= (quiz?.passing_score || 70);

    setScore(finalScore);
    setSubmitted(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("quiz_attempts").insert({
        user_id: user.id,
        quiz_id: quiz!.id,
        score: finalScore,
        answers: answers,
        passed: passed,
      });

      if (passed) {
        toast.success("Congratulations! You passed the quiz!");
      } else {
        toast.error("You didn't pass this time. Try again!");
      }

      onComplete?.(passed, finalScore);
      loadPreviousAttempts();
    } catch (error) {
      console.error("Error saving quiz attempt:", error);
      toast.error("Failed to save quiz results");
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading quiz...</p>
        </CardContent>
      </Card>
    );
  }

  if (!quiz || questions.length === 0) {
    return null;
  }

  const bestAttempt = previousAttempts.length > 0 ? previousAttempts[0] : null;

  return (
    <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              {quiz.title}
            </CardTitle>
            {quiz.description && (
              <CardDescription>{quiz.description}</CardDescription>
            )}
          </div>
          {bestAttempt && (
            <Badge variant={bestAttempt.passed ? "default" : "secondary"}>
              Best: {bestAttempt.score}%
            </Badge>
          )}
        </div>
        {!submitted && (
          <div className="text-sm text-muted-foreground">
            Passing score: {quiz.passing_score}% • {questions.length} questions
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {submitted ? (
          <div className="space-y-4">
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              {score >= quiz.passing_score ? (
                <>
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
                  <p className="text-muted-foreground mb-4">
                    You passed with a score of {score}%
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Not quite there</h3>
                  <p className="text-muted-foreground mb-4">
                    You scored {score}%. You need {quiz.passing_score}% to pass.
                  </p>
                </>
              )}
              <Progress value={score} className="h-2 mb-4" />
            </div>

            <div className="space-y-4">
              {questions.map((question, index) => {
                const userAnswer = answers[question.id];
                const isCorrect = userAnswer === question.correct_answer;

                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect
                        ? "border-green-500/50 bg-green-500/5"
                        : "border-destructive/50 bg-destructive/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold mb-2">
                          {index + 1}. {question.question}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Your answer: {userAnswer}
                        </p>
                        {!isCorrect && (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            Correct answer: {question.correct_answer}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button onClick={resetQuiz} className="w-full">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {questions.map((question, index) => (
              <div key={question.id} className="space-y-3">
                <div className="flex items-start gap-2">
                  <Badge variant="outline">{index + 1}</Badge>
                  <p className="font-semibold flex-1">{question.question}</p>
                </div>
                <RadioGroup
                  value={answers[question.id]}
                  onValueChange={(value) =>
                    setAnswers({ ...answers, [question.id]: value })
                  }
                  className="pl-8"
                >
                  {question.options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                      <Label htmlFor={`${question.id}-${option}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}

            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={Object.keys(answers).length < questions.length}
            >
              Submit Quiz
            </Button>
          </>
        )}

        {previousAttempts.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Previous Attempts
            </h4>
            <div className="space-y-2">
              {previousAttempts.slice(0, 3).map((attempt, index) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                >
                  <span>Attempt {previousAttempts.length - index}</span>
                  <Badge variant={attempt.passed ? "default" : "secondary"}>
                    {attempt.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LessonQuiz;
