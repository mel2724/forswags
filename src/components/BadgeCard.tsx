import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy, Lock } from "lucide-react";

interface BadgeCardProps {
  badge: {
    id: string;
    name: string;
    description: string | null;
    icon_url: string | null;
    criteria: string | null;
  };
  isEarned?: boolean;
  earnedAt?: string;
}

export const BadgeCard = ({ badge, isEarned = false, earnedAt }: BadgeCardProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={`relative overflow-hidden transition-all cursor-pointer ${
              isEarned 
                ? "bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/50 hover:border-primary hover:shadow-lg hover:shadow-primary/20" 
                : "bg-muted/50 border-2 border-muted hover:border-muted-foreground/30 opacity-60"
            }`}
          >
            <CardContent className="p-6 text-center space-y-3">
              <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center ${
                isEarned ? "bg-primary/20" : "bg-muted"
              }`}>
                {badge.icon_url ? (
                  <img 
                    src={badge.icon_url} 
                    alt={badge.name}
                    className={`h-12 w-12 ${!isEarned && "grayscale"}`}
                  />
                ) : isEarned ? (
                  <Trophy className="h-12 w-12 text-primary" />
                ) : (
                  <Lock className="h-12 w-12 text-muted-foreground" />
                )}
              </div>

              <div>
                <h3 className={`font-bold text-sm uppercase tracking-tight ${
                  isEarned ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {badge.name}
                </h3>
                
                {isEarned && earnedAt && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Earned
                  </Badge>
                )}
              </div>

              {!isEarned && (
                <div className="absolute inset-0 bg-background/5 backdrop-blur-[1px] flex items-center justify-center">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">{badge.name}</p>
            {badge.description && (
              <p className="text-sm text-muted-foreground">{badge.description}</p>
            )}
            {badge.criteria && !isEarned && (
              <div className="pt-2 border-t">
                <p className="text-xs font-semibold text-primary">How to earn:</p>
                <p className="text-xs text-muted-foreground">{badge.criteria}</p>
              </div>
            )}
            {isEarned && earnedAt && (
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Earned: {new Date(earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
