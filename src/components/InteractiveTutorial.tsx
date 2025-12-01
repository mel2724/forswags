import { useState, useEffect } from "react";
import { TutorialStep } from "./TutorialStep";
import { onboardingTutorialSteps, parentTutorialSteps, coachTutorialSteps, recruiterTutorialSteps } from "@/config/tutorialSteps";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";

interface InteractiveTutorialProps {
  currentOnboardingStep?: number;
  onComplete: () => void;
  enabled: boolean;
  role?: 'athlete' | 'parent' | 'coach' | 'recruiter';
}

export const InteractiveTutorial = ({ 
  currentOnboardingStep = 0, 
  onComplete,
  enabled,
  role = 'athlete'
}: InteractiveTutorialProps) => {
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const { toast } = useToast();
  const { showBadgeNotification } = useBadgeNotification();

  // Select tutorial steps based on role
  const tutorialSteps = role === 'parent' 
    ? parentTutorialSteps
    : role === 'coach'
    ? coachTutorialSteps
    : role === 'recruiter'
    ? recruiterTutorialSteps
    : (onboardingTutorialSteps[currentOnboardingStep] || []);

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
          
          // For role-based tutorials, check if this specific role's tutorial was completed
          const roleKey = role === 'athlete' ? `step_${currentOnboardingStep}` : `${role}_tutorial`;
          const stepCompleted = progress[roleKey];
          
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
  }, [currentOnboardingStep, enabled, tutorialSteps.length, role]);

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
      
      // Mark role-specific tutorial as complete
      const roleKey = role === 'athlete' ? `step_${currentOnboardingStep}` : `${role}_tutorial`;
      progress[roleKey] = true;

      await supabase
        .from('profiles')
        .update({ tutorial_progress: progress })
        .eq('id', user.id);

      // Check if this completion earned a badge
      await checkForNewBadges(user.id);

    } catch (error) {
      console.error('Error marking step complete:', error);
    }
  };

  const checkForNewBadges = async (userId: string) => {
    try {
      // Small delay to allow trigger to process
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get newly earned badges
      const { data: badges } = await supabase
        .from('user_badges')
        .select(`
          id,
          earned_at,
          badges (
            id,
            name,
            description,
            icon_url
          )
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(5);

      if (badges && badges.length > 0) {
        // Show notification for the most recent badge
        const latestBadge = badges[0];
        const badgeEarnedRecently = new Date(latestBadge.earned_at).getTime() > Date.now() - 5000; // Within last 5 seconds

        if (badgeEarnedRecently && latestBadge.badges) {
          showBadgeNotification(latestBadge.badges);
        }
      }
    } catch (error) {
      console.error('Error checking for new badges:', error);
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
