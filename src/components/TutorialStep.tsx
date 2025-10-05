import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronRight, Play } from "lucide-react";
import { TutorialStep as TutorialStepType } from "@/config/tutorialSteps";

interface TutorialStepProps {
  step: TutorialStepType;
  onNext: () => void;
  onSkip: () => void;
  isLast: boolean;
  currentStep: number;
  totalSteps: number;
}

export const TutorialStep = ({ step, onNext, onSkip, isLast, currentStep, totalSteps }: TutorialStepProps) => {
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm pointer-events-auto" onClick={onSkip} />
      
      {/* Tutorial Card */}
      <Card className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 pointer-events-auto shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <h3 className="text-lg font-semibold">{step.title}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSkip}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6">
          {step.description}
        </p>

        {step.videoId && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mb-4"
            onClick={(e) => {
              e.stopPropagation();
              // Will be handled by VideoWalkthroughModal
              const event = new CustomEvent('open-tutorial-video', { detail: step.videoId });
              window.dispatchEvent(event);
            }}
          >
            <Play className="h-4 w-4 mr-2" />
            Watch Video Guide
          </Button>
        )}
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="flex-1"
          >
            Skip Tutorial
          </Button>
          <Button
            onClick={onNext}
            className="flex-1"
          >
            {isLast ? 'Get Started' : 'Next'}
            {!isLast && <ChevronRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </Card>
    </div>
  );
};
