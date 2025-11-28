import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useToast } from "@/hooks/use-toast";

export default function AdminLayout() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.log("[AdminLayout] No session found, redirecting to auth");
        navigate("/auth", { replace: true });
        return;
      }

      console.log("[AdminLayout] Checking admin access for user:", session.user.id);

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (rolesError) {
        console.error("[AdminLayout] Error fetching roles:", rolesError);
        toast({
          title: "Access Error",
          description: "Unable to verify admin access. Please try again.",
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
        return;
      }

      console.log("[AdminLayout] User roles:", rolesData);

      if (!rolesData || rolesData.length === 0) {
        console.log("[AdminLayout] No roles found for user");
        toast({
          title: "Access Denied",
          description: "Your account needs to complete setup. Please sign in again.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate("/auth", { replace: true });
        return;
      }

      const hasAdminRole = rolesData.some(r => r.role === "admin");

      if (!hasAdminRole) {
        console.log("[AdminLayout] User is not an admin, has roles:", rolesData.map(r => r.role).join(", "));
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin area.",
          variant: "destructive",
        });
        navigate("/dashboard", { replace: true });
        return;
      }

      console.log("[AdminLayout] Admin access granted");
      setIsAdmin(true);
    } catch (error) {
      console.error("[AdminLayout] Error checking admin access:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      navigate("/auth", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4 bg-background sticky top-0 z-10">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
