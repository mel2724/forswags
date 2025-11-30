import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import logoIcon from "@/assets/forswags-logo.png";
import { ArrowLeft, Trophy, Award, Star } from "lucide-react";
import { BadgeCard } from "@/components/BadgeCard";

interface BadgeData {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  criteria: string | null;
  created_at: string;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
}

const Badges = () => {
  const navigate = useNavigate();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Load all badges
      const { data: badgesData, error: badgesError } = await supabase
        .from("badges")
        .select("*")
        .order("created_at", { ascending: true });

      if (badgesError) throw badgesError;
      setBadges(badgesData || []);

      // Load user's earned badges if authenticated
      if (user) {
        const { data: userBadgesData, error: userBadgesError } = await supabase
          .from("user_badges")
          .select("*")
          .eq("user_id", user.id);

        if (userBadgesError) throw userBadgesError;
        setUserBadges(userBadgesData || []);
      }
    } catch (error: any) {
      toast.error("Failed to load badges");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const earnedBadges = badges.filter(badge => 
    userBadges.some(ub => ub.badge_id === badge.id)
  );

  const lockedBadges = badges.filter(badge => 
    !userBadges.some(ub => ub.badge_id === badge.id)
  );

  const getUserBadge = (badgeId: string) => {
    return userBadges.find(ub => ub.badge_id === badgeId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading badges...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sports-pattern">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoIcon} alt="ForSWAGs" className="h-12" />
          </div>
          
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-primary hover:text-primary/80 font-bold">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-5xl font-black mb-3 uppercase tracking-tight flex items-center gap-3">
            <Award className="h-12 w-12 text-primary" />
            Achievements
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-muted-foreground uppercase text-sm tracking-wider">
              Earn badges as you progress
            </p>
            <Badge variant="default" className="text-sm">
              {earnedBadges.length} / {badges.length} Earned
            </Badge>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">Total Badges</p>
                  <p className="text-3xl font-black mt-1">{badges.length}</p>
                </div>
                <Trophy className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur border-2 border-secondary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">Earned</p>
                  <p className="text-3xl font-black mt-1">{earnedBadges.length}</p>
                </div>
                <Award className="h-10 w-10 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">Completion</p>
                  <p className="text-3xl font-black mt-1">
                    {badges.length > 0 ? Math.round((earnedBadges.length / badges.length) * 100) : 0}%
                  </p>
                </div>
                <Star className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Badges Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
            <TabsTrigger value="all" className="uppercase font-bold">
              All ({badges.length})
            </TabsTrigger>
            <TabsTrigger value="earned" className="uppercase font-bold">
              Earned ({earnedBadges.length})
            </TabsTrigger>
            <TabsTrigger value="locked" className="uppercase font-bold">
              Locked ({lockedBadges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {badges.length === 0 ? (
              <Card className="p-16 text-center bg-card/50 backdrop-blur border-2 border-primary/20">
                <Trophy className="h-20 w-20 text-primary mx-auto mb-6" />
                <h2 className="text-3xl font-black uppercase mb-4">No Badges Yet</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Check back soon for achievements to earn
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {badges.map((badge) => {
                  const userBadge = getUserBadge(badge.id);
                  return (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      isEarned={!!userBadge}
                      earnedAt={userBadge?.earned_at}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="earned" className="space-y-6">
            {earnedBadges.length === 0 ? (
              <Card className="p-16 text-center bg-card/50 backdrop-blur border-2 border-primary/20">
                <Award className="h-20 w-20 text-primary mx-auto mb-6" />
                <h2 className="text-3xl font-black uppercase mb-4">No Badges Earned Yet</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Complete challenges and milestones to earn your first badge!
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {earnedBadges.map((badge) => {
                  const userBadge = getUserBadge(badge.id);
                  return (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      isEarned={true}
                      earnedAt={userBadge?.earned_at}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="locked" className="space-y-6">
            {lockedBadges.length === 0 ? (
              <Card className="p-16 text-center bg-card/50 backdrop-blur border-2 border-primary/20">
                <Trophy className="h-20 w-20 text-primary mx-auto mb-6" />
                <h2 className="text-3xl font-black uppercase mb-4">All Badges Earned!</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Congratulations! You've earned every achievement!
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {lockedBadges.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    isEarned={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Badges;
