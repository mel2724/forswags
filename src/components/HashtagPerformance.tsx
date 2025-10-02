import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hash, TrendingUp, Eye, MousePointer } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface HashtagData {
  hashtag: string;
  impressions: number;
  engagements: number;
  clicks: number;
  used_count: number;
  last_used_at: string;
}

export const HashtagPerformance = () => {
  const { data: hashtagData, isLoading } = useQuery({
    queryKey: ['hashtag-performance'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hashtag_performance')
        .select('*')
        .eq('user_id', user.id)
        .order('impressions', { ascending: false })
        .limit(20);
      
      if (error) throw error;

      // Aggregate by hashtag
      const aggregated = data.reduce((acc: Record<string, HashtagData>, curr: any) => {
        if (!acc[curr.hashtag]) {
          acc[curr.hashtag] = {
            hashtag: curr.hashtag,
            impressions: 0,
            engagements: 0,
            clicks: 0,
            used_count: 0,
            last_used_at: curr.last_used_at,
          };
        }
        acc[curr.hashtag].impressions += curr.impressions || 0;
        acc[curr.hashtag].engagements += curr.engagements || 0;
        acc[curr.hashtag].clicks += curr.clicks || 0;
        acc[curr.hashtag].used_count += curr.used_count || 0;
        if (new Date(curr.last_used_at) > new Date(acc[curr.hashtag].last_used_at)) {
          acc[curr.hashtag].last_used_at = curr.last_used_at;
        }
        return acc;
      }, {});

      return Object.values(aggregated).sort((a: any, b: any) => b.impressions - a.impressions);
    },
  });

  const getEngagementRate = (hashtag: HashtagData) => {
    if (hashtag.impressions === 0) return "0";
    return ((hashtag.engagements / hashtag.impressions) * 100).toFixed(1);
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 5) return "text-green-500";
    if (rate >= 2) return "text-yellow-500";
    return "text-gray-500";
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading hashtag analytics...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          Hashtag Performance
        </CardTitle>
        <CardDescription>
          Track which hashtags drive the most engagement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hashtagData && hashtagData.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <Eye className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-2xl font-bold">
                        {hashtagData.reduce((sum: number, h: any) => sum + h.impressions, 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Impressions</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-2xl font-bold">
                        {hashtagData.reduce((sum: number, h: any) => sum + h.engagements, 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Engagements</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <Hash className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-2xl font-bold">{hashtagData.length}</p>
                      <p className="text-xs text-muted-foreground">Unique Hashtags</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                {hashtagData.map((hashtag: any) => {
                  const engagementRate = parseFloat(getEngagementRate(hashtag));
                  return (
                    <Card key={hashtag.hashtag}>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-mono">
                                {hashtag.hashtag}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Used {hashtag.used_count} times
                              </span>
                            </div>
                            <div className={`text-sm font-semibold ${getPerformanceColor(engagementRate)}`}>
                              {engagementRate}% engagement
                            </div>
                          </div>
                          
                          <Progress value={Math.min(engagementRate * 10, 100)} className="h-2" />
                          
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                <Eye className="h-3 w-3" />
                                Impressions
                              </div>
                              <p className="text-sm font-medium">{hashtag.impressions.toLocaleString()}</p>
                            </div>
                            <div>
                              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                <TrendingUp className="h-3 w-3" />
                                Engagements
                              </div>
                              <p className="text-sm font-medium">{hashtag.engagements.toLocaleString()}</p>
                            </div>
                            <div>
                              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                <MousePointer className="h-3 w-3" />
                                Clicks
                              </div>
                              <p className="text-sm font-medium">{hashtag.clicks.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Hash className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hashtag data yet. Start posting to track performance!</p>
              <p className="text-xs mt-2">
                Note: Hashtag performance tracking requires platform integration
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};