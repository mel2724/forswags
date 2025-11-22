import { LayoutDashboard, LogOut, ChevronDown } from "lucide-react";
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
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/admin" },
      { title: "Reports", url: "/admin/reports" },
    ],
  },
  {
    label: "User Management",
    items: [
      { title: "Users", url: "/admin/users" },
      { title: "Memberships", url: "/admin/memberships" },
    ],
  },
  {
    label: "Athletes & Content",
    items: [
      { title: "Athletes", url: "/admin/athletes" },
      { title: "Import Athletes", url: "/admin/import-athletes" },
      { title: "Athlete Promo", url: "/admin/athlete-promo" },
      { title: "Rankings", url: "/admin/rankings" },
      { title: "Scraping History", url: "/admin/scraping-history" },
      { title: "Schools", url: "/admin/schools" },
    ],
  },
  {
    label: "Learning",
    items: [
      { title: "Playbook for Life", url: "/admin/learning" },
      { title: "Playbook Quizzes", url: "/admin/playbook-quizzes" },
    ],
  },
  {
    label: "Coaching",
    items: [
      { title: "Coach Applications", url: "/admin/coach-applications" },
      { title: "Coaches", url: "/admin/coaches" },
      { title: "Evaluations", url: "/admin/evaluations" },
      { title: "Payment Verification", url: "/admin/evaluation-payments" },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { title: "AI Chatbot", url: "/admin/chatbot" },
      { title: "AI Usage", url: "/admin/ai-usage" },
    ],
  },
  {
    label: "Communications",
    items: [
      { title: "Email Templates", url: "/admin/email-templates" },
      { title: "Scheduled Emails", url: "/admin/scheduled-emails" },
      { title: "Send Notifications", url: "/admin/notifications" },
    ],
  },
  {
    label: "Business",
    items: [
      { title: "Memberships", url: "/admin/memberships" },
      { title: "Refunds", url: "/admin/refunds" },
      { title: "Promo Codes", url: "/admin/promo-codes" },
      { title: "Sponsors", url: "/admin/sponsors" },
      
    ],
  },
  {
    label: "Data & Compliance",
    items: [
      { title: "Consent Monitoring", url: "/admin/consent-monitoring" },
      { title: "Archived Media", url: "/admin/archived-media" },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Secret Rotation", url: "/admin/secret-rotation" },
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
                    {open && <span className="text-base font-bold">{group.label}</span>}
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
                            {open && <span className="text-base font-semibold">{item.title}</span>}
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
