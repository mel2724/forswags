import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Share2, Download, Trophy, Facebook, Twitter, Linkedin } from "lucide-react";
import confetti from "canvas-confetti";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import forSwagsLogo from "@/assets/forswags-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BadgeAchievementNotificationProps {
  badge: {
    id: string;
    name: string;
    description: string | null;
    icon_url: string | null;
  };
  onClose: () => void;
}

export const BadgeAchievementNotification = ({ 
  badge, 
  onClose 
}: BadgeAchievementNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true);
    
    // Fire confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fire confetti from multiple points
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleNativeShare = async () => {
    const badgeElement = document.getElementById('badge-share-card');
    if (!badgeElement) {
      toast.error("Badge image not found");
      return;
    }

    try {
      const dataUrl = await toPng(badgeElement, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `${badge.name.replace(/\s+/g, '_')}_badge.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: `I earned the "${badge.name}" badge!`,
            text: `Just earned the "${badge.name}" badge on ForSWAGs! 🎉`,
            files: [file]
          });
          toast.success("Badge shared successfully!");
        } catch (shareError: any) {
          if (shareError.name === 'AbortError') return;
          toast.error("Share cancelled");
        }
      } else {
        toast.error("Native sharing not supported on this device");
      }
    } catch (error) {
      console.error('Error sharing badge:', error);
      toast.error("Failed to prepare badge. Please try again.");
    }
  };

  const handleSocialShare = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    const shareText = `I just earned the "${badge.name}" badge on ForSWAGs! 🎉`;
    const currentUrl = window.location.origin;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
        break;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    toast.success(`Opening ${platform}...`);
  };

  const handleDownload = async () => {
    const badgeElement = document.getElementById('badge-share-card');
    if (!badgeElement) return;

    try {
      const dataUrl = await toPng(badgeElement, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const link = document.createElement('a');
      link.download = `${badge.name.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success("Badge image downloaded!");
    } catch (error) {
      console.error('Error downloading badge:', error);
      toast.error("Failed to download badge");
    }
  };

  return (
    <>
      {/* Achievement Notification Overlay */}
      <div 
        className={`fixed inset-0 z-[9998] bg-background/80 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Achievement Card */}
      <div 
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] transition-all duration-500 ${
          isVisible 
            ? 'opacity-100 scale-100 rotate-0' 
            : 'opacity-0 scale-75 rotate-12'
        }`}
      >
        <Card className="w-[90vw] max-w-md bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-4 border-primary shadow-2xl shadow-primary/20 overflow-hidden">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 hover:bg-primary/20"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Content */}
          <div className="p-8 text-center space-y-6">
            {/* Animated Trophy Icon */}
            <div className="relative animate-bounce">
              <div className="absolute inset-0 blur-xl bg-primary/30 rounded-full" />
              <div className="relative mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
                <Trophy className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>

            {/* Achievement Text */}
            <div className="space-y-2 animate-fade-in">
              <Badge variant="secondary" className="text-xs uppercase tracking-wider">
                Achievement Unlocked!
              </Badge>
              <h2 className="text-3xl font-black uppercase tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {badge.name}
              </h2>
              {badge.description && (
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {badge.description}
                </p>
              )}
            </div>

            {/* Badge Icon */}
            {badge.icon_url && (
              <div className="flex justify-center animate-scale-in">
                <img 
                  src={badge.icon_url} 
                  alt={badge.name}
                  className="h-20 w-20 drop-shadow-lg"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center pt-4" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:bg-primary/10 hover:border-primary transition-all"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  <DropdownMenuItem onClick={handleNativeShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Native Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSocialShare('facebook')}>
                    <Facebook className="mr-2 h-4 w-4" />
                    Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSocialShare('twitter')}>
                    <Twitter className="mr-2 h-4 w-4" />
                    Twitter/X
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSocialShare('linkedin')}>
                    <Linkedin className="mr-2 h-4 w-4" />
                    LinkedIn
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="hover:bg-secondary/10 hover:border-secondary transition-all"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary animate-pulse" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-secondary via-primary to-secondary animate-pulse" />
        </Card>
      </div>

      {/* Hidden Shareable Badge Card */}
      <div className="fixed -left-[9999px] -top-[9999px]">
        <div 
          id="badge-share-card"
          className="w-[600px] h-[600px] bg-white flex flex-col items-center justify-center p-12 relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full" 
              style={{ 
                backgroundImage: `radial-gradient(circle at 2px 2px, #9333ea 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }} 
            />
          </div>

          {/* Content */}
          <div className="relative z-10 space-y-8 text-center">
            {/* Badge Icon */}
            <div className="mx-auto h-40 w-40 rounded-full bg-gradient-to-br from-[#9333ea] to-[#f59e0b] flex items-center justify-center shadow-2xl">
              {badge.icon_url ? (
                <img 
                  src={badge.icon_url} 
                  alt={badge.name}
                  className="h-24 w-24"
                  crossOrigin="anonymous"
                />
              ) : (
                <Trophy className="h-24 w-24 text-white" />
              )}
            </div>

            {/* Text */}
            <div className="space-y-4">
              <div className="inline-block px-6 py-2 bg-[#f59e0b]/20 rounded-full">
                <p className="text-sm font-bold uppercase tracking-wider text-[#f59e0b]">
                  Achievement Unlocked
                </p>
              </div>
              <h2 className="text-5xl font-black uppercase tracking-tight text-[#1a1a1a]">
                {badge.name}
              </h2>
              {badge.description && (
                <p className="text-lg text-[#4a4a4a] max-w-md mx-auto leading-relaxed">
                  {badge.description}
                </p>
              )}
            </div>

            {/* Footer with Logo */}
            <div className="pt-8 space-y-3">
              {/* Logo */}
              <div className="flex justify-center mb-2">
                <img 
                  src={forSwagsLogo} 
                  alt="ForSWAGs Logo" 
                  className="h-12 w-auto"
                  crossOrigin="anonymous"
                />
              </div>
              <p className="text-sm font-bold text-[#9333ea] pt-2">
                www.ForSWAGs.com
              </p>
            </div>
          </div>

          {/* Decorative Corner Elements */}
          <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-[#9333ea]/40 rounded-tl-2xl" />
          <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-[#f59e0b]/40 rounded-tr-2xl" />
          <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-[#f59e0b]/40 rounded-bl-2xl" />
          <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-[#9333ea]/40 rounded-br-2xl" />
        </div>
      </div>
    </>
  );
};
