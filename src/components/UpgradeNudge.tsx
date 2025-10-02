import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  title = "Upgrade to unlock premium features",
  description = "Get unlimited access to all tools and insights",
  variant = "compact",
  dismissible = true,
  highlight,
}: UpgradeNudgeProps) {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  if (variant === "compact") {
    return (
      <div className="relative">
        <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-full bg-primary/10">
                  <Crown className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{title}</p>
                  {highlight && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {highlight}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigate("/membership")}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Upgrade
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
      <Card className="border-primary/50 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-bold text-lg mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              {highlight && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-medium">{highlight}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={() => navigate("/membership")}>
                  <Crown className="mr-2 h-4 w-4" />
                  View Plans
                </Button>
                {dismissible && (
                  <Button
                    variant="outline"
                    onClick={() => setIsDismissed(true)}
                  >
                    Maybe Later
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
