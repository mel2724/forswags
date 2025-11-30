import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { Download, Calendar as CalendarIcon, Trophy, Sparkles, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAthletePromo() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const queryClient = useQueryClient();

  // Fetch current athlete of the week
  const { data: currentAOTW, isLoading: aotwLoading } = useQuery({
    queryKey: ['current-aotw'],
    queryFn: async () => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      const { data, error } = await supabase
        .from('athlete_of_week')
        .select(`
          *,
          athletes (
            *,
            profiles:user_id (full_name, avatar_url)
          )
        `)
        .eq('week_start_date', format(startOfWeek, 'yyyy-MM-dd'))
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Fetch social media calendar
  const { data: calendar, isLoading: calendarLoading } = useQuery({
    queryKey: ['social-calendar', selectedDate],
    queryFn: async () => {
      const startDate = selectedDate || new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);

      const { data, error } = await supabase
        .from('social_media_calendar')
        .select(`
          *,
          athletes (
            *,
            profiles:user_id (full_name, avatar_url)
          )
        `)
        .gte('scheduled_date', format(startDate, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(endDate, 'yyyy-MM-dd'))
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Generate athlete of the week
  const generateAOTW = useMutation({
    mutationFn: async (forceGenerate: boolean = false) => {
      const { data, error } = await supabase.functions.invoke('generate-athlete-of-week', {
        body: { forceGenerate },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Athlete of the Week generated successfully!");
      queryClient.invalidateQueries({ queryKey: ['current-aotw'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate Athlete of the Week");
    },
  });

  // Generate social calendar
  const generateCalendar = useMutation({
    mutationFn: async (weeksAhead: number = 4) => {
      const { data, error } = await supabase.functions.invoke('generate-social-calendar', {
        body: { weeksAhead },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Generated ${data.count} social media posts!`);
      queryClient.invalidateQueries({ queryKey: ['social-calendar'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate social calendar");
    },
  });

  // Download media pack
  const downloadMediaPack = useMutation({
    mutationFn: async ({ athleteIds, weekStartDate }: { athleteIds: string[], weekStartDate?: string }) => {
      const { data, error } = await supabase.functions.invoke('download-athlete-media-pack', {
        body: { athleteIds, weekStartDate },
      });

      if (error) throw error;
      
      // Check if response is an error (JSON) instead of a ZIP file
      if (data && typeof data === 'object' && 'error' in data) {
        throw new Error(data.error);
      }
      
      // Create blob and download
      const blob = new Blob([data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `athlete_media_pack_${weekStartDate || format(new Date(), 'yyyy-MM-dd')}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast.success("Media pack downloaded successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to download media pack");
    },
  });

  const handleDownloadAOTWMedia = () => {
    if (currentAOTW) {
      downloadMediaPack.mutate({
        athleteIds: [currentAOTW.athlete_id],
        weekStartDate: currentAOTW.week_start_date,
      });
    }
  };

  const handleDownloadCalendarMedia = () => {
    if (calendar && calendar.length > 0) {
      const athleteIds = calendar.map(c => c.athlete_id);
      downloadMediaPack.mutate({ athleteIds });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Athlete Promotion Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage weekly athlete features and social media calendar
          </p>
        </div>
      </div>

      <Tabs defaultValue="aotw" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="aotw" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Athlete of the Week
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Social Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aotw" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Current Athlete of the Week
                  </CardTitle>
                  <CardDescription>
                    Auto-generated every Sunday morning or generate manually
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => generateAOTW.mutate(true)}
                    disabled={generateAOTW.isPending}
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${generateAOTW.isPending ? 'animate-spin' : ''}`} />
                    Regenerate
                  </Button>
                  <Button
                    onClick={() => generateAOTW.mutate(false)}
                    disabled={generateAOTW.isPending || !!currentAOTW}
                  >
                    Generate Now
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {aotwLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : currentAOTW ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    {currentAOTW.athletes.profiles.avatar_url && (
                      <img
                        src={currentAOTW.athletes.profiles.avatar_url}
                        alt={currentAOTW.athletes.profiles.full_name}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">
                        {currentAOTW.athletes.profiles.full_name}
                      </h3>
                      <p className="text-muted-foreground">
                        {currentAOTW.athletes.sport} • {currentAOTW.athletes.position} • Class of {currentAOTW.athletes.graduation_year}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">{currentAOTW.selection_criteria}</Badge>
                        <Badge variant="outline">
                          {format(new Date(currentAOTW.week_start_date), 'MMM d')} - {format(new Date(currentAOTW.week_end_date), 'MMM d, yyyy')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <h4 className="font-semibold">Selection Rationale:</h4>
                    <p className="text-sm">{currentAOTW.selection_rationale}</p>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-lg space-y-2">
                    <h4 className="font-semibold">Generated Copy:</h4>
                    <p className="text-sm">{currentAOTW.generated_copy}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {currentAOTW.suggested_hashtags.map((tag: string) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleDownloadAOTWMedia} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Media Pack (ZIP)
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No Athlete of the Week for current week</p>
                  <p className="text-sm">Click "Generate Now" to create one</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Social Media Promotion Calendar</CardTitle>
                  <CardDescription>
                    Schedule daily athlete features to ensure everyone gets promoted
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => generateCalendar.mutate(4)}
                    disabled={generateCalendar.isPending}
                  >
                    <Sparkles className={`h-4 w-4 mr-2 ${generateCalendar.isPending ? 'animate-spin' : ''}`} />
                    Generate 4 Weeks
                  </Button>
                  {calendar && calendar.length > 0 && (
                    <Button onClick={handleDownloadCalendarMedia} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download All Media
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Scheduled Posts</h3>
                  {calendarLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : calendar && calendar.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {calendar.map((post) => (
                        <Card key={post.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {post.athletes.profiles.avatar_url && (
                                <img
                                  src={post.athletes.profiles.avatar_url}
                                  alt={post.athletes.profiles.full_name}
                                  className="w-12 h-12 rounded object-cover"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold truncate">
                                    {post.athletes.profiles.full_name}
                                  </p>
                                  <Badge variant={post.status === 'posted' ? 'default' : 'secondary'}>
                                    {post.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(post.scheduled_date), 'EEE, MMM d, yyyy')}
                                </p>
                                <p className="text-sm mt-2 line-clamp-2">{post.generated_copy}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No posts scheduled</p>
                      <p className="text-sm">Click "Generate 4 Weeks" to create schedule</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}