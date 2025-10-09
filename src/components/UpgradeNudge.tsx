import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, TrendingUp, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface UpgradeNudgeProps {
  title?: string;
  description?: string;
  variant?: "compact" | "full";
  dismissible?: boolean;
  highlight?: string;
}

export function UpgradeNudge({
  title = "🚀 Unlock Premium Features",
  description = "Get 3x more profile views, unlimited videos, and AI-powered tools",
  variant = "compact",
  dismissible = true,
  highlight = "Premium athletes get noticed faster",
}: UpgradeNudgeProps) {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  if (variant === "compact") {
    return (
      <div className="relative">
        <Card className="border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-full bg-primary animate-pulse">
                  <Crown className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {highlight}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigate("/membership")}
                  size="sm"
                  className="whitespace-nowrap font-bold"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Upgrade Now
                </Button>
                {dismissible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDismissed(true)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative">
      <Card className="border-primary bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary animate-pulse">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-black text-xl">{title}</h3>
                  <Badge variant="secondary" className="font-bold">
                    🔥 POPULAR
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 py-3 border-y">
                <div className="text-center">
                  <p className="text-2xl font-black text-primary">3x</p>
                  <p className="text-xs text-muted-foreground">More Views</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-primary">∞</p>
                  <p className="text-xs text-muted-foreground">Videos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-primary">24/7</p>
                  <p className="text-xs text-muted-foreground">Support</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm bg-primary/10 rounded-lg p-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-bold">{highlight}</span>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => navigate("/membership")} size="lg" className="flex-1 font-bold">
                  <Crown className="mr-2 h-5 w-5" />
                  Upgrade to Premium
                </Button>
                {dismissible && (
                  <Button
                    variant="outline"
                    onClick={() => setIsDismissed(true)}
                    size="lg"
                  >
                    Later
                  </Button>
                )}
              </div>
              
              <p className="text-xs text-center text-muted-foreground">
                💳 30-day money-back guarantee • ⚡ Instant activation • 🔒 Cancel anytime
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
