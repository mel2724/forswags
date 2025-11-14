import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, ExternalLink, PlayCircle, Clock, Heart } from "lucide-react";
import { toast } from "sonner";
import { trackVideoView } from "@/lib/videoTracking";
import { KnowledgeCheck } from "./KnowledgeCheck";

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
  const [favoritedVideos, setFavoritedVideos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [totalCompletions, setTotalCompletions] = useState(0);
  const [isPlaylistComplete, setIsPlaylistComplete] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const videoRef = useRef<HTMLIFrameElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    loadVideos();
    loadCompletions();
    loadFavorites();
  }, [moduleId]);

  useEffect(() => {
    // Reset start time when video changes and track view
    startTimeRef.current = Date.now();
    if (videos[currentVideoIndex]) {
      trackVideoView(videos[currentVideoIndex].id);
    }
  }, [currentVideoIndex, videos]);

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

  const loadFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("video_favorites")
        .select("lesson_id")
        .eq("user_id", user.id);

      if (error) throw error;
      
      const favorites = new Set(data?.map(f => f.lesson_id) || []);
      setFavoritedVideos(favorites);
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const toggleFavorite = async (videoId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isFavorited = favoritedVideos.has(videoId);

      if (isFavorited) {
        // Remove favorite
        const { error } = await supabase
          .from("video_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("lesson_id", videoId);

        if (error) throw error;

        setFavoritedVideos(prev => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
        toast.success("Removed from favorites");
      } else {
        // Add favorite
        const { error } = await supabase
          .from("video_favorites")
          .insert({
            user_id: user.id,
            lesson_id: videoId,
          });

        if (error) throw error;

        setFavoritedVideos(prev => new Set([...prev, videoId]));
        toast.success("Added to favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorites");
    }
  };

  const markVideoComplete = async (videoId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const watchDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);

      // Track completion in video_completions table
      const { error } = await supabase
        .from("video_completions")
        .upsert({
          user_id: user.id,
          lesson_id: videoId,
          watch_duration_seconds: watchDuration,
        });

      if (error) throw error;

      // Also track in playbook_video_views with completion status
      await trackVideoView(videoId, watchDuration, true);

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

      // Check if all videos in module are complete
      const allComplete = videos.every(v => 
        completedVideos.has(v.id) || v.id === videoId
      );

      if (allComplete) {
        // Playlist complete! Show celebration
        setIsPlaylistComplete(true);
        setShowCompletionScreen(true);
        
        // Trigger confetti
        const { default: confetti } = await import("canvas-confetti");
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        toast.success("🎉 Playlist Complete! Certificate being generated...");

        console.log("Module completed! Generating certificate...");
        
        // Trigger certificate generation
        try {
          const { error: certError } = await supabase.functions.invoke('generate-module-certificate', {
            body: {
              userId: user.id,
              moduleId: moduleId,
              courseId: courseId
            }
          });

          if (certError) {
            console.error("Error generating certificate:", certError);
          }
        } catch (certError) {
          console.error("Failed to generate certificate:", certError);
        }
        
        // DO NOT auto-advance since there's no next video
        return;
      }

      // Auto-play next video if not complete
      if (currentVideoIndex < videos.length - 1) {
        setTimeout(() => {
          setCurrentVideoIndex(currentVideoIndex + 1);
          toast.success("Moving to next video!");
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
  const isFavorited = favoritedVideos.has(currentVideo.id);
  const completionPercentage = Math.round((completedVideos.size / videos.length) * 100);

  // Show completion screen if playlist is complete
  if (showCompletionScreen) {
    return (
      <Card className="border-2 border-primary">
        <CardContent className="p-12 text-center">
          <div className="mb-6 text-6xl">🎓</div>
          <h2 className="text-3xl font-bold mb-4">Playlist Complete!</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Congratulations! You've completed all videos in this module.
          </p>
          
          <div className="bg-muted/50 rounded-lg p-6 mb-8 max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">{videos.length}</div>
                <div className="text-sm text-muted-foreground">Videos Watched</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-500">100%</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-foreground">
              📧 Your certificate has been generated and sent to your email!
            </p>
          </div>

          <Button 
            onClick={() => window.history.back()}
            size="lg"
          >
            Return to Course
          </Button>
        </CardContent>
      </Card>
    );
  }

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
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite(currentVideo.id)}
                  className="relative"
                >
                  <Heart 
                    className={`h-5 w-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`}
                  />
                </Button>
                {isCompleted && (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                  </Badge>
                )}
              </div>
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

            {currentVideoIndex < videos.length - 1 && !isCompleted && (
              <Button 
                variant="outline"
                onClick={() => setCurrentVideoIndex(currentVideoIndex + 1)}
              >
                Next Video
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Knowledge Check */}
        {!isCompleted && (
          <KnowledgeCheck 
            lessonId={currentVideo.id}
            onComplete={() => markVideoComplete(currentVideo.id)}
          />
        )}
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
                className={`h-2 rounded-full transition-all ${completionPercentage === 100 ? 'bg-green-500' : 'bg-primary'}`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            {completionPercentage === 100 && (
              <p className="text-xs text-green-500 font-semibold mt-1 text-right">🎉 Complete!</p>
            )}
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
                  const isVideoFavorited = favoritedVideos.has(video.id);
                  
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
                          <div className="flex items-center gap-2">
                            <p className={`font-medium text-sm line-clamp-2 flex-1 ${
                              isActive ? 'text-primary-foreground' : ''
                            }`}>
                              {video.title}
                            </p>
                            {isVideoFavorited && (
                              <Heart className="h-4 w-4 fill-red-500 text-red-500 flex-shrink-0" />
                            )}
                          </div>
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