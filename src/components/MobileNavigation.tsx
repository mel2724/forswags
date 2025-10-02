import { NavLink, useLocation } from "react-router-dom";
import { Home, User, Trophy, Bell, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const mobileNavItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/evaluations", icon: Trophy, label: "Evaluations" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
];

export function MobileNavigation() {
  const isMobile = useIsMobile();
  const location = useLocation();

  // Only show on authenticated routes
  const noNavRoutes = ["/", "/auth", "/sponsors", "/sponsor-showcase"];
  if (noNavRoutes.includes(location.pathname)) return null;

  if (!isMobile) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 pb-safe"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex justify-around items-center h-16 px-2">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[60px] py-2 px-3 rounded-lg transition-all",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
