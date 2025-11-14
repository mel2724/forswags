import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  order_index: number;
  explanation: string | null;
}

interface KnowledgeCheckProps {
  lessonId: string;
  onComplete: () => void;
}

export const KnowledgeCheck = ({ lessonId, onComplete }: KnowledgeCheckProps) => {
  const [quiz, setQuiz] = useState<{ id: string; title: string; passing_score: number } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [passed, setPassed] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuiz();
  }, [lessonId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setSubmitted(false);
      setAnswers({});

      // Get quiz for this lesson
      const { data: quizData, error: quizError } = await supabase
        .from("lesson_quizzes")
        .select("id, title, passing_score")
        .eq("lesson_id", lessonId)
        .single();

      if (quizError || !quizData) {
        setQuiz(null);
        setQuestions([]);
        return;
      }

      setQuiz(quizData);

      // Get questions for this quiz
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("id, question_text, options, correct_answer, order_index, explanation")
        .eq("quiz_id", quizData.id)
        .order("order_index");

      if (questionsError) throw questionsError;

      // Type-cast options from Json to string[]
      const formattedQuestions = (questionsData || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options as string[] : []
      }));

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error("Error loading quiz:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      toast.error("Please answer all questions");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate score
      let correct = 0;
      questions.forEach(q => {
        if (answers[q.id] === q.correct_answer) {
          correct++;
        }
      });

      const scorePercentage = Math.round((correct / questions.length) * 100);
      const hasPassed = scorePercentage >= (quiz?.passing_score || 70);

      setScore(scorePercentage);
      setPassed(hasPassed);
      setSubmitted(true);

      // Save attempt
      const { error: attemptError } = await supabase
        .from("quiz_attempts")
        .insert({
          user_id: user.id,
          quiz_id: quiz!.id,
          score: scorePercentage,
          answers: answers,
          passed: hasPassed,
        });

      if (attemptError) throw attemptError;

      if (hasPassed) {
        toast.success("✅ Knowledge check passed! Checking playlist progress...");
        // Trigger completion with delay
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        toast.error("Try again! You need " + (quiz?.passing_score || 70) + "% to pass");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit answers");
    }
  };

  const handleRetry = () => {
    setSubmitted(false);
    setAnswers({});
    setScore(0);
    setPassed(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading knowledge check...
        </CardContent>
      </Card>
    );
  }

  if (!quiz || questions.length === 0) {
    return null;
  }

  if (submitted) {
    return (
      <Card className={passed ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-red-500 bg-red-50 dark:bg-red-950/20"}>
        <CardHeader>
          <div className="flex items-center gap-2">
            {passed ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <CardTitle>
              {passed ? "Great Job!" : "Not Quite"}
            </CardTitle>
          </div>
          <CardDescription>
            You scored {score}% (Need {quiz.passing_score}% to pass)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Review Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Review Your Answers:</h4>
            {questions.map((question, index) => {
              const userAnswer = answers[question.id];
              const isCorrect = userAnswer === question.correct_answer;
              
              return (
                <div key={question.id} className="space-y-2 p-4 rounded-lg bg-background border">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-2">
                        {index + 1}. {question.question_text}
                      </p>
                      <div className="space-y-1 text-sm">
                        <p className={isCorrect ? "text-green-600" : "text-red-600"}>
                          Your answer: {userAnswer}
                        </p>
                        {!isCorrect && (
                          <p className="text-green-600">
                            Correct answer: {question.correct_answer}
                          </p>
                        )}
                        {question.explanation && (
                          <p className="text-muted-foreground mt-2 pt-2 border-t">
                            <span className="font-medium">Explanation:</span> {question.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {passed ? (
            <p className="text-sm text-muted-foreground">
              You've completed this video. Moving to the next one...
            </p>
          ) : (
            <Button onClick={handleRetry} className="gap-2 w-full">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{quiz.title || "Knowledge Check"}</CardTitle>
        <CardDescription>
          Answer these questions to complete the video ({questions.length} question{questions.length > 1 ? 's' : ''})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-3">
            <Label className="text-base font-medium">
              {index + 1}. {question.question_text}
            </Label>
            <RadioGroup
              value={answers[question.id] || ""}
              onValueChange={(value) => setAnswers({ ...answers, [question.id]: value })}
            >
              {question.options.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                  <Label 
                    htmlFor={`${question.id}-${optIndex}`}
                    className="font-normal cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}

        <Button 
          onClick={handleSubmit} 
          className="w-full gap-2"
          disabled={Object.keys(answers).length !== questions.length}
        >
          <CheckCircle2 className="h-4 w-4" />
          Submit Answers
        </Button>
      </CardContent>
    </Card>
  );
};
