import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { useUserTier } from "@/hooks/useFeatureAccess";

interface OnboardingStep {
  id: string;
  label: string;
  completed: boolean;
}

interface OnboardingProgressMeterProps {
  profile: any;
  athlete: any;
  stats: any[];
}

export function OnboardingProgressMeter({ profile, athlete, stats }: OnboardingProgressMeterProps) {
  const { isFree } = useUserTier();

  // Only show for free users
  if (!isFree) return null;

  const steps: OnboardingStep[] = [
    {
      id: "profile_complete",
      label: "Complete your profile",
      completed: athlete ? (athlete.profile_completion_pct || 0) >= 80 : false,
    },
    {
      id: "tutorial_complete",
      label: "Complete the tutorial",
      completed: profile?.tutorial_completed || false,
    },
    {
      id: "profile_photo",
      label: "Upload a profile photo",
      completed: !!athlete?.profile_photo_url,
    },
    {
      id: "stats_added",
      label: "Add your stats",
      completed: stats && stats.length > 0,
    },
    {
      id: "highlights_video",
      label: "Add highlights video",
      completed: !!athlete?.highlights_url,
    },
  ];

  const completedCount = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedCount / totalSteps) * 100;
  const isComplete = completedCount === totalSteps;

  // Don't show if everything is complete
  if (isComplete) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Complete Your Setup</CardTitle>
        </div>
        <CardDescription>
          {completedCount} of {totalSteps} steps completed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progressPercentage} className="h-2" />
        
        <div className="space-y-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex items-center gap-3 text-sm"
            >
              {step.completed ? (
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className={step.completed ? "text-muted-foreground line-through" : "text-foreground"}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {!isComplete && (
          <p className="text-xs text-muted-foreground pt-2">
            Complete these steps to get the most out of your profile
          </p>
        )}
      </CardContent>
    </Card>
  );
}
