import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Step {
  title: string;
  description?: string;
  completed: boolean;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  variant?: "linear" | "steps";
}

export function ProgressIndicator({
  steps,
  currentStep,
  variant = "steps",
}: ProgressIndicatorProps) {
  const completedSteps = steps.filter((s) => s.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  if (variant === "linear") {
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span className="text-muted-foreground">
            {completedSteps} of {steps.length} complete
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="relative">
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Steps */}
      <div className="relative">
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = step.completed;
            const isCurrent = index === currentStep;
            const isPast = index < currentStep;

            return (
              <div
                key={index}
                className="flex flex-col items-center flex-1 relative"
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={`absolute top-4 left-[50%] right-[-50%] h-0.5 -translate-y-1/2 ${
                      isCompleted || isPast
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                  />
                )}

                {/* Step circle */}
                <div
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                      ? "border-primary bg-background text-primary"
                      : "border-muted bg-background text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Step label */}
                <div className="mt-2 text-center max-w-[120px]">
                  <div
                    className={`text-xs font-medium ${
                      isCurrent
                        ? "text-primary"
                        : isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
