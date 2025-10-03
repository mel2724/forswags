import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { SkipToContent } from "@/components/SkipToContent";
import { MobileNavigation } from "@/components/MobileNavigation";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { UpdateNotification } from "@/components/UpdateNotification";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Routes that should NOT show the sidebar
  const noSidebarRoutes = ["/", "/auth", "/sponsors", "/sponsor-showcase"];
  const shouldShowSidebar = isAuthenticated && !noSidebarRoutes.includes(location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen>
      <SkipToContent />
      <OfflineIndicator />
      <UpdateNotification />
      <PWAInstallPrompt />
      <div className="min-h-screen flex w-full pb-safe">
        <AppSidebar />
        <div className="flex-1 flex flex-col mb-16 md:mb-0">
          {/* Header with trigger */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center gap-4 px-4">
              <SidebarTrigger />
              <div className="flex-1">
                <Breadcrumbs />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchOpen(true)}
                className="gap-2"
                aria-label="Open search"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden sm:inline pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
          </header>
          <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

          {/* Main content */}
          <main className="flex-1" id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
        <MobileNavigation />
      </div>
    </SidebarProvider>
  );
}
