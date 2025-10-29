import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TwoFactorAuth } from "@/components/security/TwoFactorAuth";
import { ActivityLog } from "@/components/security/ActivityLog";
import { DataExport } from "@/components/security/DataExport";
import { SecurityAudit } from "@/components/security/SecurityAudit";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function SecuritySettings() {
  // Security Audit is admin-only and protected by backend RLS/role checks
  // No need for client-side role filtering - AdminLayout already protects /admin routes
  return (
    <div className="container max-w-6xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
          <p className="text-muted-foreground">
            Manage your account security and privacy
          </p>
        </div>

        <Tabs defaultValue="2fa" className="space-y-4">
          <TabsList>
            <TabsTrigger value="2fa">Two-Factor Auth</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
            <TabsTrigger value="export">Data Export</TabsTrigger>
            <TabsTrigger value="audit">Security Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="2fa" className="space-y-4">
            <TwoFactorAuth />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <ActivityLog />
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <DataExport />
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <SecurityAudit />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
