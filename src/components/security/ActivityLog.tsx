import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, Shield, User, Settings, Download, LogIn, LogOut } from "lucide-react";
import { format } from "date-fns";

const actionIcons: Record<string, any> = {
  login: LogIn,
  logout: LogOut,
  profile_update: User,
  settings_change: Settings,
  mfa_enabled: Shield,
  mfa_disabled: Shield,
  data_export: Download,
  role_change: Shield,
};

const actionColors: Record<string, string> = {
  login: "bg-blue-500",
  logout: "bg-gray-500",
  profile_update: "bg-green-500",
  settings_change: "bg-yellow-500",
  mfa_enabled: "bg-green-500",
  mfa_disabled: "bg-red-500",
  data_export: "bg-purple-500",
  role_change: "bg-orange-500",
};

export function ActivityLog() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Loading your recent activity...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Activity Log
        </CardTitle>
        <CardDescription>
          Recent security-related activities on your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {logs?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activity recorded yet
              </p>
            ) : (
              logs?.map((log) => {
                const Icon = actionIcons[log.action] || FileText;
                const colorClass = actionColors[log.action] || "bg-gray-500";

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${colorClass} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">
                          {log.action.split('_').map(w => 
                            w.charAt(0).toUpperCase() + w.slice(1)
                          ).join(' ')}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {log.resource_type}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "PPp")}
                      </p>
                      
                      {log.ip_address && (
                        <p className="text-xs text-muted-foreground">
                          IP: {log.ip_address}
                        </p>
                      )}
                      
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Details
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
