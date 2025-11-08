import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Trophy, Lock, Twitter, Facebook, Linkedin, Share2 } from "lucide-react";
import { toast } from "sonner";

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
  athleteName?: string;
  profileUrl?: string;
}

export const BadgeCard = ({ badge, isEarned = false, earnedAt, athleteName, profileUrl }: BadgeCardProps) => {
  const handleShare = async (platform: 'twitter' | 'facebook' | 'linkedin' | 'copy') => {
    const shareText = athleteName 
      ? `${athleteName} earned the "${badge.name}" badge on ForSWAGs! 🏆`
      : `I earned the "${badge.name}" badge on ForSWAGs! 🏆`;
    
    const shareUrl = profileUrl || window.location.href;
    
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
          toast.success('Badge achievement copied to clipboard!');
          return;
        } catch (error) {
          toast.error('Failed to copy to clipboard');
          return;
        }
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={`relative overflow-hidden transition-all cursor-pointer group ${
              isEarned 
                ? "bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/50 hover:border-primary hover:shadow-lg hover:shadow-primary/20" 
                : "bg-muted/50 border-2 border-muted hover:border-muted-foreground/30 opacity-60"
            }`}
          >
            <CardContent className="p-6 text-center space-y-3 relative">
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

              {/* Social Share Buttons - Only for earned badges */}
              {isEarned && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 hover:bg-primary/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare('twitter');
                      }}
                      title="Share on Twitter"
                    >
                      <Twitter className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 hover:bg-primary/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare('facebook');
                      }}
                      title="Share on Facebook"
                    >
                      <Facebook className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 hover:bg-primary/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare('linkedin');
                      }}
                      title="Share on LinkedIn"
                    >
                      <Linkedin className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 hover:bg-primary/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare('copy');
                      }}
                      title="Copy to clipboard"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
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
