import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity } from "lucide-react";

interface HeatmapData {
  date: string;
  count: number;
  day: number;
  week: number;
}

export const UserActivityHeatmap = () => {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"30" | "90" | "365">("90");
  const [maxCount, setMaxCount] = useState(0);

  useEffect(() => {
    fetchActivityData();
  }, [timeRange]);

  const fetchActivityData = async () => {
    setLoading(true);
    try {
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch audit logs for the time period
      const { data: logs, error } = await supabase
        .from("audit_logs")
        .select("created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Process data into daily counts
      const activityMap = new Map<string, number>();
      const today = new Date();
      
      // Initialize all dates with 0 count
      for (let i = 0; i < daysAgo; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        activityMap.set(dateStr, 0);
      }

      // Count activities per day
      logs?.forEach((log) => {
        const dateStr = log.created_at.split('T')[0];
        activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
      });

      // Convert to array and calculate week/day positions
      const heatmapData: HeatmapData[] = [];
      let max = 0;
      
      Array.from(activityMap.entries()).forEach(([dateStr, count], index) => {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();
        const weekNumber = Math.floor(index / 7);
        
        heatmapData.push({
          date: dateStr,
          count,
          day: dayOfWeek,
          week: weekNumber,
        });
        
        if (count > max) max = count;
      });

      setMaxCount(max);
      setData(heatmapData.reverse());
    } catch (error) {
      console.error("Error fetching activity data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getColorIntensity = (count: number): string => {
    if (count === 0) return "bg-muted";
    const intensity = Math.min((count / maxCount) * 100, 100);
    
    if (intensity <= 25) return "bg-primary/25";
    if (intensity <= 50) return "bg-primary/50";
    if (intensity <= 75) return "bg-primary/75";
    return "bg-primary";
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeks = Math.ceil(data.length / 7);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            User Activity Heatmap
          </CardTitle>
          <CardDescription>Loading activity data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              User Activity Heatmap
            </CardTitle>
            <CardDescription>
              Visual representation of user activity over time
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <div className="inline-flex gap-1">
              {/* Day labels */}
              <div className="flex flex-col gap-1 pr-2 text-xs text-muted-foreground">
                {dayLabels.map((day, i) => (
                  <div key={day} className="h-3 flex items-center" style={{ height: '12px' }}>
                    {i % 2 === 1 && day}
                  </div>
                ))}
              </div>

              {/* Heatmap cells */}
              <div className="flex gap-1">
                {Array.from({ length: weeks }).map((_, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                      const cellData = data.find(
                        (d) => d.week === weekIndex && d.day === dayIndex
                      );
                      
                      return (
                        <div
                          key={`${weekIndex}-${dayIndex}`}
                          className={`h-3 w-3 rounded-sm transition-colors hover:ring-2 hover:ring-primary/50 cursor-pointer ${
                            cellData ? getColorIntensity(cellData.count) : "bg-muted/30"
                          }`}
                          title={
                            cellData
                              ? `${formatDate(cellData.date)}: ${cellData.count} ${
                                  cellData.count === 1 ? "activity" : "activities"
                                }`
                              : "No data"
                          }
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {data.reduce((sum, d) => sum + d.count, 0)} activities in the last {timeRange} days
            </span>
            <div className="flex items-center gap-2">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="h-3 w-3 rounded-sm bg-muted" />
                <div className="h-3 w-3 rounded-sm bg-primary/25" />
                <div className="h-3 w-3 rounded-sm bg-primary/50" />
                <div className="h-3 w-3 rounded-sm bg-primary/75" />
                <div className="h-3 w-3 rounded-sm bg-primary" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
