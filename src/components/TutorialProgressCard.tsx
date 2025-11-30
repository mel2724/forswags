import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { BadgeCard } from "./BadgeCard";
import { Rocket, Trophy, Users, Award, Search, GraduationCap } from "lucide-react";

interface TutorialProgressCardProps {
  userId: string;
}

export const TutorialProgressCard = ({ userId }: TutorialProgressCardProps) => {
  const [tutorialProgress, setTutorialProgress] = useState<Record<string, boolean>>({});
  const [tutorialBadges, setTutorialBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTutorialData();
  }, [userId]);

  const loadTutorialData = async () => {
    try {
      // Get tutorial progress
      const { data: profileData } = await supabase
        .from("profiles")
        .select("tutorial_progress, tutorial_completed")
        .eq("id", userId)
        .single();

      if (profileData?.tutorial_progress) {
        setTutorialProgress(profileData.tutorial_progress as Record<string, boolean>);
      }

      // Get tutorial badges
      const { data: badgesData } = await supabase
        .from("user_badges")
        .select(`
          id,
          earned_at,
          badges (
            id,
            name,
            description,
            icon_url,
            criteria
          )
        `)
        .eq("user_id", userId);

      const tutorialBadgeNames = [
        'Tutorial Explorer',
        'Tutorial Graduate - Athlete',
        'Tutorial Graduate - Parent',
        'Tutorial Graduate - Coach',
        'Tutorial Graduate - Scout',
        'Tutorial Master'
      ];

      const userTutorialBadges = badgesData?.filter(ub => 
        tutorialBadgeNames.includes(ub.badges?.name || '')
      ) || [];

      setTutorialBadges(userTutorialBadges);
    } catch (error) {
      console.error("Error loading tutorial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    const completedSections = Object.values(tutorialProgress).filter(Boolean).length;
    const totalSections = Object.keys(tutorialProgress).length;
    return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
  };

  const getTutorialStats = () => {
    const progress = tutorialProgress as Record<string, boolean>;
    return {
      athlete: progress.athlete_tutorial || progress.step_6 || false,
      parent: progress.parent_tutorial || false,
      coach: progress.coach_tutorial || false,
      recruiter: progress.recruiter_tutorial || false,
    };
  };

  const stats = getTutorialStats();
  const completionPercentage = calculateProgress();

  if (loading) {
    return null;
  }

  // Only show if user has started tutorials
  if (Object.keys(tutorialProgress).length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="uppercase tracking-tight flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Tutorial Progress
            </CardTitle>
            <CardDescription>Your learning journey on ForSWAGs</CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg font-bold">
            {completionPercentage}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Completion</span>
            <span className="text-muted-foreground">
              {Object.values(tutorialProgress).filter(Boolean).length} / {Object.keys(tutorialProgress).length} sections
            </span>
          </div>
          <Progress value={completionPercentage} className="h-3" />
        </div>

        {/* Role-Specific Progress */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Role Tutorials
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {stats.athlete && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <Trophy className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">Athlete</p>
                  <Badge variant="secondary" className="text-[10px] h-5">Complete</Badge>
                </div>
              </div>
            )}
            {stats.parent && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                <Users className="h-4 w-4 text-secondary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">Parent</p>
                  <Badge variant="secondary" className="text-[10px] h-5">Complete</Badge>
                </div>
              </div>
            )}
            {stats.coach && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <Award className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">Coach</p>
                  <Badge variant="secondary" className="text-[10px] h-5">Complete</Badge>
                </div>
              </div>
            )}
            {stats.recruiter && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                <Search className="h-4 w-4 text-secondary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">Scout</p>
                  <Badge variant="secondary" className="text-[10px] h-5">Complete</Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tutorial Badges */}
        {tutorialBadges.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Earned Badges ({tutorialBadges.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {tutorialBadges.map((userBadge) => (
                <BadgeCard
                  key={userBadge.id}
                  badge={userBadge.badges}
                  isEarned={true}
                  earnedAt={userBadge.earned_at}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
