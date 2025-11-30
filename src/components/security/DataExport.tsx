import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, FileDown, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { format } from "date-fns";

export function DataExport() {
  const [requesting, setRequesting] = useState(false);
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const queryClient = useQueryClient();

  const { data: exportRequests, isLoading } = useQuery({
    queryKey: ["data-export-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_export_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const requestExport = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("export-user-data");
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-export-requests"] });
      
      logAction({
        action: "data_export_requested",
        resourceType: "user_data",
      });

      toast({
        title: "Export Requested",
        description: "Your data export has been requested. You'll be notified when it's ready.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRequestExport = async () => {
    setRequesting(true);
    await requestExport.mutateAsync();
    setRequesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Data Export (GDPR)
        </CardTitle>
        <CardDescription>
          Request a complete export of your personal data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <FileDown className="h-4 w-4" />
          <AlertDescription>
            You have the right to receive a copy of all your personal data. The export will include:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Profile information</li>
              <li>Activity logs</li>
              <li>Media uploads</li>
              <li>Messages and communications</li>
              <li>All other associated data</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleRequestExport}
          disabled={requesting || isLoading}
          className="w-full"
        >
          {requesting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Requesting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Request Data Export
            </>
          )}
        </Button>

        {exportRequests && exportRequests.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Export Requests</h4>
            <div className="space-y-2">
              {exportRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <p className="text-sm font-medium capitalize">{request.status}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(request.created_at), "PPp")}
                      </p>
                    </div>
                  </div>

                  {request.status === 'completed' && request.export_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={request.export_url} download>
                        <Download className="mr-2 h-3 w-3" />
                        Download
                      </a>
                    </Button>
                  )}

                  {request.status === 'failed' && request.error_message && (
                    <p className="text-xs text-destructive">{request.error_message}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
