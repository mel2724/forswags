import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, AlertTriangle, CheckCircle2, Users, Database } from "lucide-react";

export function SecurityAudit() {
  const { data: users } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          full_name,
          user_roles (
            role
          )
        `)
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  const { data: auditStats } = useQuery({
    queryKey: ["audit-stats"],
    queryFn: async () => {
      const { count: totalLogs } = await supabase
        .from("audit_logs")
        .select("*", { count: "exact", head: true });

      const { count: sensitiveActions } = await supabase
        .from("audit_logs")
        .select("*", { count: "exact", head: true })
        .in("action", ["role_change", "mfa_disabled", "data_export"]);

      const { data: recentAlerts } = await supabase
        .from("audit_logs")
        .select("*")
        .in("action", ["failed_login", "unauthorized_access"])
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(10);

      return {
        totalLogs: totalLogs || 0,
        sensitiveActions: sensitiveActions || 0,
        recentAlerts: recentAlerts || [],
      };
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Overview
          </CardTitle>
          <CardDescription>
            Monitor security metrics and access controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Total Audit Logs</span>
              </div>
              <p className="text-2xl font-bold">{auditStats?.totalLogs || 0}</p>
            </div>

            <div className="space-y-2 p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Sensitive Actions</span>
              </div>
              <p className="text-2xl font-bold">{auditStats?.sensitiveActions || 0}</p>
            </div>

            <div className="space-y-2 p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Total Users</span>
              </div>
              <p className="text-2xl font-bold">{users?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role-Based Access Control</CardTitle>
          <CardDescription>
            Review user roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {users?.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{user.full_name || "No name"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {user.user_roles?.length > 0 ? (
                      user.user_roles.map((ur: any) => (
                        <Badge key={ur.role} variant="outline">
                          {ur.role}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary">No role</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {auditStats && auditStats.recentAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Recent Security Alerts
            </CardTitle>
            <CardDescription>
              Potential security issues detected in the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditStats.recentAlerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-1" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{alert.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                    {alert.ip_address && (
                      <p className="text-xs text-muted-foreground">
                        IP: {alert.ip_address}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
