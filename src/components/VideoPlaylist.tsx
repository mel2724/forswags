import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, ExternalLink, PlayCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  external_link: string | null;
  duration_minutes: number | null;
  order_index: number;
}

interface VideoPlaylistProps {
  moduleId: string;
  courseId: string;
}

export const VideoPlaylist = ({ moduleId, courseId }: VideoPlaylistProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [totalCompletions, setTotalCompletions] = useState(0);
  const videoRef = useRef<HTMLIFrameElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    loadVideos();
    loadCompletions();
  }, [moduleId]);

  useEffect(() => {
    // Reset start time when video changes
    startTimeRef.current = Date.now();
  }, [currentVideoIndex]);

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title, description, video_url, external_link, duration_minutes, order_index")
        .eq("module_id", moduleId)
        .not("video_url", "is", null)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error("Error loading videos:", error);
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const loadCompletions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("video_completions")
        .select("lesson_id")
        .eq("user_id", user.id);

      if (error) throw error;
      
      const completed = new Set(data?.map(c => c.lesson_id) || []);
      setCompletedVideos(completed);
      setTotalCompletions(completed.size);
    } catch (error) {
      console.error("Error loading completions:", error);
    }
  };

  const markVideoComplete = async (videoId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const watchDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);

      const { error } = await supabase
        .from("video_completions")
        .upsert({
          user_id: user.id,
          lesson_id: videoId,
          watch_duration_seconds: watchDuration,
        });

      if (error) throw error;

      setCompletedVideos(prev => new Set([...prev, videoId]));
      setTotalCompletions(prev => prev + 1);
      
      // Check for badge awards
      const newTotal = totalCompletions + 1;
      if (newTotal === 5) {
        toast.success("🎖️ Badge Earned: Video Learner!");
      } else if (newTotal === 10) {
        toast.success("🎖️ Badge Earned: Life Skills Student!");
      } else if (newTotal === 25) {
        toast.success("🎖️ Badge Earned: Playbook Graduate!");
      } else {
        toast.success("Video completed! Keep learning!");
      }

      // Auto-play next video
      if (currentVideoIndex < videos.length - 1) {
        setTimeout(() => {
          setCurrentVideoIndex(currentVideoIndex + 1);
        }, 2000);
      }
    } catch (error) {
      console.error("Error marking video complete:", error);
      toast.error("Failed to track completion");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading videos...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <PlayCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No videos available yet</p>
        </CardContent>
      </Card>
    );
  }

  const currentVideo = videos[currentVideoIndex];
  const isCompleted = completedVideos.has(currentVideo.id);
  const completionPercentage = Math.round((completedVideos.size / videos.length) * 100);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Video Player */}
      <div className="md:col-span-2 space-y-4">
        <Card className="overflow-hidden border-2 border-primary/20">
          <div className="aspect-video bg-black">
            <iframe
              ref={videoRef}
              src={currentVideo.video_url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{currentVideo.title}</CardTitle>
                {currentVideo.description && (
                  <CardDescription className="text-base">
                    {currentVideo.description}
                  </CardDescription>
                )}
              </div>
              {isCompleted && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Completed
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {currentVideo.duration_minutes && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {currentVideo.duration_minutes} min
                </div>
              )}
              {currentVideo.external_link && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(currentVideo.external_link!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Learn More
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {!isCompleted && (
                <Button 
                  onClick={() => markVideoComplete(currentVideo.id)}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Complete
                </Button>
              )}
              {currentVideoIndex < videos.length - 1 && (
                <Button 
                  variant="outline"
                  onClick={() => setCurrentVideoIndex(currentVideoIndex + 1)}
                >
                  Next Video
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Playlist */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Playlist Progress</CardTitle>
            <CardDescription>
              {completedVideos.size} of {videos.length} completed ({completionPercentage}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Videos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="space-y-1 p-4">
                {videos.map((video, index) => {
                  const isActive = index === currentVideoIndex;
                  const isVideoCompleted = completedVideos.has(video.id);
                  
                  return (
                    <button
                      key={video.id}
                      onClick={() => setCurrentVideoIndex(index)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {isVideoCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                              isActive ? 'border-primary-foreground' : 'border-muted-foreground'
                            }`}>
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm line-clamp-2 ${
                            isActive ? 'text-primary-foreground' : ''
                          }`}>
                            {video.title}
                          </p>
                          {video.duration_minutes && (
                            <p className={`text-xs mt-1 ${
                              isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                            }`}>
                              {video.duration_minutes} min
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};