import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserTier } from "@/hooks/useFeatureAccess";

interface UpgradePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  feature?: string;
  benefits?: string[];
  context?: "general" | "limit" | "feature" | "analytics";
}

const DEFAULT_BENEFITS = {
  general: [
    "🎥 Unlimited video uploads - showcase every highlight",
    "📊 Advanced analytics - track profile views and engagement",
    "🎯 Expert Prime Dime matching - find your perfect fit",
    "✨ Premium profile features - stand out to college scouts",
    "🏆 Priority support - get help when you need it",
    "📱 Social media tools - build your personal brand",
    "📈 3x more profile views from college scouts",
  ],
  limit: [
    "🚀 Unlimited video uploads - no more 1-video restriction",
    "📹 Showcase your full athletic journey",
    "💪 Complete profile access - all premium fields unlocked",
    "🎯 Advanced analytics to track your scouting progress",
    "⚡ Priority support from our team",
    "📊 Get 3x more exposure to college scouts",
  ],
  feature: [
    "🔓 Unlock all premium profile fields",
    "📈 Advanced analytics dashboard with college scout insights",
    "🤖 AI-powered content generation tools",
    "⭐ Priority listing in athlete search results",
    "🎓 Professional development resources and webinars",
    "💼 Direct messaging with college coaches",
  ],
  analytics: [
    "📊 Detailed performance metrics and trends",
    "👀 College scout engagement tracking - see who's viewing",
    "📈 Profile view analytics with geographic data",
    "🔍 Comparison insights vs similar athletes",
    "📄 Export professional reports (PDF/Excel)",
    "🎯 Conversion tracking for offers and contacts",
  ],
};

export function UpgradePromptDialog({
  open,
  onOpenChange,
  title = "Upgrade to Premium",
  description = "Unlock all features and take your athletic career to the next level",
  feature,
  benefits,
  context = "general",
}: UpgradePromptDialogProps) {
  const navigate = useNavigate();
  const { tier } = useUserTier();

  const displayBenefits = benefits || DEFAULT_BENEFITS[context];

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/membership");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <Badge variant="secondary" className="uppercase font-bold">
              {tier === "free" ? "Free Plan" : tier}
            </Badge>
          </div>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {feature && (
            <div className="p-4 rounded-lg bg-muted border-l-4 border-primary">
              <p className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Feature: {feature}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <p className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Premium Benefits:
            </p>
            <ul className="space-y-2">
              {displayBenefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 mt-4">
            <p className="text-sm font-semibold text-center mb-2">
              🎁 Limited Time: Save 46% with Annual Plan
            </p>
            <p className="text-xs text-center text-muted-foreground">
              Join 1,000+ athletes already using ForSWAGs Premium
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <Button onClick={handleUpgrade} className="w-full" size="lg">
              <Crown className="mr-2 h-4 w-4" />
              Unlock Premium Features
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-primary" />
              30-day guarantee
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-primary" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-primary" />
              Instant access
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
