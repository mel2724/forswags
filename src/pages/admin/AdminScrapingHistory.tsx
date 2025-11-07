import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ScrapingHistoryEntry {
  id: string;
  sport: string;
  status: string;
  athletes_scraped: number;
  athletes_imported: number;
  athletes_skipped: number;
  sources_attempted: string[];
  sources_succeeded: string[];
  errors: any[];
  started_at: string;
  completed_at: string | null;
  metadata: any;
}

export default function AdminScrapingHistory() {
  const [history, setHistory] = useState<ScrapingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("scraping_history")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error("Error loading scraping history:", error);
      toast({
        title: "Error loading history",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      completed: "default",
      failed: "destructive",
      pending: "secondary",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  };

  const calculateSuccessRate = (entry: ScrapingHistoryEntry) => {
    if (entry.athletes_scraped === 0) return "N/A";
    const rate = (entry.athletes_imported / entry.athletes_scraped) * 100;
    return `${rate.toFixed(1)}%`;
  };

  const getDuration = (entry: ScrapingHistoryEntry) => {
    if (!entry.completed_at) return "In progress...";
    const start = new Date(entry.started_at);
    const end = new Date(entry.completed_at);
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Scraping History</h1>
          <p className="text-muted-foreground mt-2">
            Track all external ranking import attempts and their results
          </p>
        </div>
        <Button onClick={loadHistory} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>
            Most recent 50 scraping operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No scraping history found. Run an import to see results here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>Sources</TableHead>
                    <TableHead>Scraped</TableHead>
                    <TableHead>Imported</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(entry.status)}
                          {getStatusBadge(entry.status)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{entry.sport}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {entry.sources_succeeded?.map((source) => (
                            <Badge key={source} variant="default" className="text-xs">
                              {source}
                            </Badge>
                          ))}
                          {entry.sources_attempted?.filter(s => !entry.sources_succeeded?.includes(s)).map((source) => (
                            <Badge key={source} variant="outline" className="text-xs">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{entry.athletes_scraped}</TableCell>
                      <TableCell>{entry.athletes_imported}</TableCell>
                      <TableCell>
                        <span className={
                          entry.athletes_imported === entry.athletes_scraped
                            ? "text-green-600 font-medium"
                            : "text-yellow-600"
                        }>
                          {calculateSuccessRate(entry)}
                        </span>
                      </TableCell>
                      <TableCell>{getDuration(entry)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.started_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        {entry.errors && entry.errors.length > 0 ? (
                          <Badge variant="destructive">
                            {entry.errors.length} error{entry.errors.length !== 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
