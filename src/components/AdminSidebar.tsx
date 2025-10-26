import { Users, GraduationCap, Trophy, School, LayoutDashboard, LogOut, Mail, CreditCard, Clipboard, TrendingUp, Bell, FileVideo, DollarSign, UserPlus, FileBarChart, Sparkles, MessageSquare, Shield } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoIcon from "@/assets/forswags-logo.png";

const items = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Reports", url: "/admin/reports", icon: FileBarChart },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Memberships", url: "/admin/memberships", icon: CreditCard },
  { title: "Athletes", url: "/admin/athletes", icon: Trophy },
  { title: "Import Athletes", url: "/admin/import-athletes", icon: UserPlus },
  { title: "Athlete Promo", url: "/admin/athlete-promo", icon: Sparkles },
  { title: "AI Chatbot", url: "/admin/chatbot", icon: MessageSquare },
  { title: "Rankings", url: "/admin/rankings", icon: TrendingUp },
  { title: "Courses", url: "/admin/courses", icon: GraduationCap },
  { title: "Schools", url: "/admin/schools", icon: School },
  { title: "Coach Applications", url: "/admin/coach-applications", icon: Clipboard },
  { title: "Evaluations", url: "/admin/evaluations", icon: FileVideo },
  { title: "Sponsors", url: "/admin/sponsors", icon: DollarSign },
  { title: "Email Templates", url: "/admin/email-templates", icon: Mail },
  { title: "Send Notifications", url: "/admin/notifications", icon: Bell },
  { title: "Secret Rotation", url: "/admin/secret-rotation", icon: Shield },
];

export function AdminSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

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

  return (
    <Sidebar className={open ? "w-60" : "w-14"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <img src={logoIcon} alt="ForSWAGs" className="h-8" />
          {open && <span className="font-bold text-lg">Admin</span>}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/admin"} className={getNavCls(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
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
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
