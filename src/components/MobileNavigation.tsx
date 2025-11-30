import { NavLink, useLocation } from "react-router-dom";
import { Home, User, Trophy, Bell, Sparkles, GraduationCap, Search, BarChart3, Users, ClipboardCheck, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "athlete" | "coach" | "recruiter" | "parent" | "admin";

const athleteNavItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/prime-dime", icon: Sparkles, label: "Prime Dime" },
  { to: "/evaluations", icon: Trophy, label: "Evals" },
  { to: "/learning", icon: GraduationCap, label: "Learn" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
];

const recruiterNavItems = [
  { to: "/recruiter/dashboard", icon: Home, label: "Home" },
  { to: "/recruiter/search", icon: Search, label: "Search" },
  { to: "/recruiter/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/players", icon: Users, label: "Players" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
];

const coachNavItems = [
  { to: "/coach/dashboard", icon: Home, label: "Home" },
  { to: "/coach/available", icon: ClipboardCheck, label: "Evals" },
  { to: "/coach/profile", icon: User, label: "Profile" },
  { to: "/coaches", icon: Users, label: "Directory" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
];

const parentNavItems = [
  { to: "/parent/dashboard", icon: Home, label: "Home" },
  { to: "/learning", icon: GraduationCap, label: "Learning" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
];

export function MobileNavigation() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleData?.role) {
        setUserRole(roleData.role as UserRole);
      } else {
        const { data: athleteData } = await supabase
          .from("athletes")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (athleteData) {
          setUserRole("athlete");
        } else {
          const { data: recruiterData } = await supabase
            .from("recruiter_profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (recruiterData) {
            setUserRole("recruiter");
          }
        }
      }
    } catch (error) {
      console.error("Error loading user role:", error);
    }
  };

  const getMobileNavItems = () => {
    switch (userRole) {
      case "athlete":
        return athleteNavItems;
      case "recruiter":
        return recruiterNavItems;
      case "coach":
        return coachNavItems;
      case "parent":
        return parentNavItems;
      case "admin":
        return athleteNavItems; // Admins can use athlete nav or redirect to desktop
      default:
        return athleteNavItems;
    }
  };

  const mobileNavItems = getMobileNavItems();

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
