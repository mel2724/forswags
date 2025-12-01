import { useNavigate, useLocation } from "react-router-dom";
import { Share2, Target, BarChart3, User, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  athleteId?: string;
}

export function MobileBottomNav({ athleteId }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      icon: Home,
      label: "Home",
      path: "/dashboard",
      onClick: () => navigate("/dashboard"),
    },
    {
      icon: Share2,
      label: "Social",
      path: "/social-media",
      onClick: () => navigate("/social-media"),
    },
    {
      icon: Target,
      label: "Prime Dime",
      path: "/prime-dime",
      onClick: () => navigate("/prime-dime"),
    },
    {
      icon: BarChart3,
      label: "Stats",
      path: "/stats",
      onClick: () => navigate("/stats"),
    },
    {
      icon: User,
      label: "Profile",
      path: athleteId ? `/profile/${athleteId}` : "/profile",
      onClick: () => navigate(athleteId ? `/profile/${athleteId}` : "/profile"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border shadow-lg md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={item.onClick}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200",
                "active:scale-95",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={item.label}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium transition-all",
                  isActive && "font-bold"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
