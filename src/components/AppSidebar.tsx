import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Trophy,
  GraduationCap,
  BarChart3,
  Settings,
  Bell,
  Medal,
  Video,
  Share2,
  CreditCard,
  Target,
  Image,
  Award,
  UserCircle,
  Search,
  Shield,
  FileText,
  School,
  Mail,
  DollarSign,
  ClipboardCheck,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoIcon from "@/assets/forswags-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserRole = "athlete" | "coach" | "recruiter" | "parent" | "admin";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    athlete: true,
    coach: true,
    recruiter: true,
    admin: true,
  });

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setUserProfile(profile);

      // Check user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleData?.role) {
        setUserRole(roleData.role as UserRole);
      } else {
        // Check if athlete
        const { data: athleteData } = await supabase
          .from("athletes")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (athleteData) {
          setUserRole("athlete");
        } else {
          // Check if recruiter
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const athleteItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Profile", url: "/profile", icon: UserCircle },
    { title: "Stats Manager", url: "/stats", icon: BarChart3 },
    { title: "Evaluations", url: "/evaluations", icon: ClipboardCheck },
    { title: "Courses", url: "/courses", icon: GraduationCap },
    { title: "Badges", url: "/badges", icon: Medal },
    { title: "Rankings", url: "/rankings", icon: Trophy },
    { title: "Offers", url: "/offers", icon: Target },
    { title: "Media Gallery", url: "/media", icon: Image },
    { title: "Social Media", url: "/social", icon: Share2 },
    { title: "Preferences", url: "/preferences", icon: Settings },
    { title: "Membership", url: "/membership", icon: CreditCard },
  ];

  const coachItems = [
    { title: "Coach Dashboard", url: "/coach/dashboard", icon: Home },
    { title: "My Profile", url: "/coach/profile", icon: User },
    { title: "Available Evaluations", url: "/coach/available", icon: Video },
    { title: "Coach Directory", url: "/coaches", icon: Users },
  ];

  const recruiterItems = [
    { title: "Recruiter Dashboard", url: "/recruiter/dashboard", icon: Home },
    { title: "Athlete Search", url: "/recruiter/search", icon: Search },
    { title: "My Profile", url: "/recruiter/profile", icon: User },
    { title: "Rankings", url: "/rankings", icon: Trophy },
  ];

  const parentItems = [
    { title: "Parent Dashboard", url: "/parent/dashboard", icon: Home },
    { title: "Courses", url: "/courses", icon: GraduationCap },
  ];

  const adminItems = [
    { title: "Admin Dashboard", url: "/admin", icon: Shield },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "Athletes", url: "/admin/athletes", icon: UserCircle },
    { title: "Evaluations", url: "/admin/evaluations", icon: ClipboardCheck },
    { title: "Rankings", url: "/admin/rankings", icon: Trophy },
    { title: "Courses", url: "/admin/courses", icon: GraduationCap },
    { title: "Schools", url: "/admin/schools", icon: School },
    { title: "Coach Applications", url: "/admin/coach-applications", icon: FileText },
    { title: "Memberships", url: "/admin/memberships", icon: CreditCard },
    { title: "Sponsors", url: "/admin/sponsors", icon: DollarSign },
    { title: "Email Templates", url: "/admin/email-templates", icon: Mail },
    { title: "Notifications", url: "/admin/notifications", icon: Bell },
  ];

  const toggleGroup = (groupKey: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const renderMenuGroup = (title: string, items: any[], groupKey: string) => {
    const hasActiveItem = items.some((item) => isActive(item.url));
    const isOpen = openGroups[groupKey] !== false;

    return (
      <Collapsible open={isOpen} onOpenChange={() => toggleGroup(groupKey)}>
        <SidebarGroup>
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
              <span>{title}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `flex items-center gap-2 ${
                              isActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-muted/50"
                            }`
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <img src={logoIcon} alt="ForSWAGs" className={collapsed ? "h-8" : "h-10"} />
          {!collapsed && (
            <span className="font-black text-lg">ForSWAGs</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {/* General Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/notifications"
                    className={({ isActive }) =>
                      `flex items-center gap-2 ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50"
                      }`
                    }
                  >
                    <Bell className="h-4 w-4" />
                    {!collapsed && <span>Notifications</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Role-based navigation */}
        {userRole === "athlete" && renderMenuGroup("Athlete", athleteItems, "athlete")}
        {userRole === "coach" && renderMenuGroup("Coach", coachItems, "coach")}
        {userRole === "recruiter" && renderMenuGroup("Recruiter", recruiterItems, "recruiter")}
        {userRole === "parent" && renderMenuGroup("Parent", parentItems, "parent")}
        {userRole === "admin" && renderMenuGroup("Admin", adminItems, "admin")}
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        {!collapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={userProfile?.avatar_url} />
                  <AvatarFallback>
                    {userProfile?.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {userProfile?.full_name || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {userRole || "Member"}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/membership")}>
                <CreditCard className="h-4 w-4 mr-2" />
                Membership
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
