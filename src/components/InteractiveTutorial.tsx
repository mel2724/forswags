import { useState, useEffect } from "react";
import { TutorialStep } from "./TutorialStep";
import { onboardingTutorialSteps } from "@/config/tutorialSteps";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InteractiveTutorialProps {
  currentOnboardingStep: number;
  onComplete: () => void;
  enabled: boolean;
}

export const InteractiveTutorial = ({ 
  currentOnboardingStep, 
  onComplete,
  enabled 
}: InteractiveTutorialProps) => {
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const { toast } = useToast();

  const tutorialSteps = onboardingTutorialSteps[currentOnboardingStep] || [];

  useEffect(() => {
    // Check if tutorial should be shown
    const checkTutorialStatus = async () => {
      if (!enabled || tutorialSteps.length === 0) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('tutorial_completed, tutorial_progress')
          .eq('id', user.id)
          .single();

        if (profile && !profile.tutorial_completed) {
          const progress = profile.tutorial_progress || {};
          const stepCompleted = progress[`step_${currentOnboardingStep}`];
          
          if (!stepCompleted && tutorialSteps.length > 0) {
            setShowTutorial(true);
            setCurrentTutorialStep(0);
          }
        }
      } catch (error) {
        console.error('Error checking tutorial status:', error);
      }
    };

    checkTutorialStatus();
  }, [currentOnboardingStep, enabled, tutorialSteps.length]);

  const handleNext = async () => {
    if (currentTutorialStep < tutorialSteps.length - 1) {
      setCurrentTutorialStep(currentTutorialStep + 1);
    } else {
      await markStepComplete();
      setShowTutorial(false);
    }
  };

  const handleSkip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ tutorial_completed: true })
          .eq('id', user.id);
      }
      setShowTutorial(false);
      onComplete();
    } catch (error) {
      console.error('Error skipping tutorial:', error);
    }
  };

  const markStepComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tutorial_progress')
        .eq('id', user.id)
        .single();

      const progress = profile?.tutorial_progress || {};
      progress[`step_${currentOnboardingStep}`] = true;

      await supabase
        .from('profiles')
        .update({ tutorial_progress: progress })
        .eq('id', user.id);

    } catch (error) {
      console.error('Error marking step complete:', error);
    }
  };

  // Return null if not enabled, no steps, or not showing tutorial
  if (!enabled || tutorialSteps.length === 0 || !showTutorial) {
    return null;
  }

  return (
    <TutorialStep
      step={tutorialSteps[currentTutorialStep]}
      onNext={handleNext}
      onSkip={handleSkip}
      isLast={currentTutorialStep === tutorialSteps.length - 1}
      currentStep={currentTutorialStep + 1}
      totalSteps={tutorialSteps.length}
    />
  );
};
