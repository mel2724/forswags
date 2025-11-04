import { Users, GraduationCap, Trophy, School, LayoutDashboard, LogOut, Mail, CreditCard, Clipboard, TrendingUp, Bell, FileVideo, DollarSign, UserPlus, FileBarChart, Sparkles, MessageSquare, Shield, Activity, ChevronDown, BarChart3, UsersRound, Target, BookOpen, Bot, MessageCircle, Briefcase, Settings } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoIcon from "@/assets/forswags-logo.png";

type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

type MenuGroup = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "Overview",
    icon: BarChart3,
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
      { title: "Reports", url: "/admin/reports", icon: FileBarChart },
    ],
  },
  {
    label: "User Management",
    icon: UsersRound,
    items: [
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Memberships", url: "/admin/memberships", icon: CreditCard },
    ],
  },
  {
    label: "Athlete Management",
    icon: Trophy,
    items: [
      { title: "Athletes", url: "/admin/athletes", icon: Trophy },
      { title: "Import Athletes", url: "/admin/import-athletes", icon: UserPlus },
      { title: "Athlete Promo", url: "/admin/athlete-promo", icon: Sparkles },
      { title: "Rankings", url: "/admin/rankings", icon: TrendingUp },
    ],
  },
  {
    label: "Learning",
    icon: BookOpen,
    items: [
      { title: "Courses", url: "/admin/courses", icon: GraduationCap },
      { title: "Playbook Dashboard", url: "/admin/playbook-dashboard", icon: School },
    ],
  },
  {
    label: "Coaching",
    icon: Target,
    items: [
      { title: "Coach Applications", url: "/admin/coach-applications", icon: Clipboard },
      { title: "Evaluations", url: "/admin/evaluations", icon: FileVideo },
      { title: "Payment Verification", url: "/admin/evaluation-payments", icon: DollarSign },
    ],
  },
  {
    label: "AI Tools",
    icon: Bot,
    items: [
      { title: "AI Chatbot", url: "/admin/chatbot", icon: MessageSquare },
      { title: "AI Usage", url: "/admin/ai-usage", icon: Activity },
    ],
  },
  {
    label: "Communications",
    icon: MessageCircle,
    items: [
      { title: "Email Templates", url: "/admin/email-templates", icon: Mail },
      { title: "Send Notifications", url: "/admin/notifications", icon: Bell },
    ],
  },
  {
    label: "Business",
    icon: Briefcase,
    items: [
      { title: "Sponsors", url: "/admin/sponsors", icon: DollarSign },
    ],
  },
  {
    label: "System",
    icon: Settings,
    items: [
      { title: "Secret Rotation", url: "/admin/secret-rotation", icon: Shield },
    ],
  },
];

export function AdminSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // Track which groups are open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    // Initialize with groups that contain the active route open
    const initial: Record<string, boolean> = {};
    menuGroups.forEach(group => {
      const hasActiveRoute = group.items.some(item => {
        if (item.url === "/admin") {
          return currentPath === item.url;
        }
        return currentPath.startsWith(item.url);
      });
      initial[group.label] = hasActiveRoute;
    });
    return initial;
  });

  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) =>
    isActive(path) ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted/50";

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <Sidebar className={open ? "w-60" : "w-14"} collapsible="icon">
      <SidebarHeader className="p-4 flex items-center gap-2">
        <img src={logoIcon} alt="ForSWAGs" className="h-8" />
        {open && <span className="font-bold text-lg">Admin</span>}
      </SidebarHeader>

      <SidebarContent>
        {menuGroups.map((group) => (
          <Collapsible
            key={group.label}
            open={openGroups[group.label]}
            onOpenChange={() => toggleGroup(group.label)}
          >
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md transition-colors group/label">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <group.icon className="h-4 w-4" />
                      {open && <span>{group.label}</span>}
                    </div>
                    {open && (
                      <ChevronDown className={`h-4 w-4 transition-transform ${openGroups[group.label] ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={item.url} 
                            end={item.url === "/admin"} 
                            className={getNavCls(item.url)}
                          >
                            <item.icon className="h-4 w-4" />
                            {open && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => navigate("/dashboard")}
        >
          <LayoutDashboard className="h-4 w-4" />
          {open && <span className="ml-2">Back to App</span>}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start mt-2"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          {open && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
