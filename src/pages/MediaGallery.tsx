import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Upload, Trash2, Video, Plus, Edit, ExternalLink, Link as LinkIcon, Crown, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { useMembershipStatus } from "@/hooks/useMembershipStatus";
import { UpgradePromptDialog } from "@/components/UpgradePromptDialog";
import { useUpgradePrompt } from "@/hooks/useUpgradePrompt";

interface MediaAsset {
  id: string;
  title: string;
  description: string | null;
  url: string;
  media_type: string;
  created_at: string;
  display_order: number;
  season: string | null;
}

const MediaGallery = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [introVideo, setIntroVideo] = useState<MediaAsset | null>(null);
  const [communityVideo, setCommunityVideo] = useState<MediaAsset | null>(null);
  const [gameVideos, setGameVideos] = useState<MediaAsset[]>([]);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<MediaAsset | null>(null);
  const { isFree } = useMembershipStatus();
  const { isOpen, config, showUpgradePrompt, closeUpgradePrompt } = useUpgradePrompt();
  const [totalVideos, setTotalVideos] = useState(0);

  useEffect(() => {
    loadMediaAssets();
  }, []);

  const loadMediaAssets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: athlete } = await supabase
        .from("athletes")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!athlete) {
        toast.error("Please complete your athlete profile first");
        navigate("/profile");
        return;
      }

      setAthleteId(athlete.id);

      const { data: media, error } = await supabase
        .from("media_assets")
        .select("*")
        .eq("athlete_id", athlete.id)
        .in("media_type", ["introduction_video", "community_video", "game_video"])
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (media) {
        setIntroVideo(media.find(m => m.media_type === "introduction_video") || null);
        setCommunityVideo(media.find(m => m.media_type === "community_video") || null);
        setGameVideos(media.filter(m => m.media_type === "game_video"));
        setTotalVideos(media.length);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateVideoFile = (file: File): boolean => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/mpeg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload MP4, MOV, AVI, or MPEG videos only.");
      return false;
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.error("File too large. Maximum video size is 500MB.");
      return false;
    }

    return true;
  };

  const handleUpload = async (
    file: File,
    mediaType: "introduction_video" | "community_video" | "game_video",
    title: string,
    description: string,
    season: string = "",
    onSuccess?: () => void
  ) => {
    if (!athleteId) return false;

    // Validate file
    if (!validateVideoFile(file)) {
      return false;
    }

    // Check free tier limit
    if (isFree && totalVideos >= 1) {
      showUpgradePrompt({
        title: "Video Upload Limit Reached",
        description: "Free tier is limited to 1 video. Upgrade to upload unlimited videos!",
        feature: "Unlimited Video Uploads",
        context: "limit",
        benefits: [
          "Upload unlimited introduction, community, and game videos",
          "Showcase your full athletic journey",
          "Build a comprehensive highlight reel",
          "Stand out to college recruiters",
        ]
      });
      return false;
    }

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Rate limiting - max 5 uploads per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentUploads } = await supabase
        .from("media_assets")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", oneHourAgo);

      if (recentUploads && recentUploads.length >= 5) {
        toast.error("Rate limit exceeded. Maximum 5 uploads per hour. Please try again later.");
        setUploading(false);
        return false;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${mediaType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("media-assets")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media-assets")
        .getPublicUrl(fileName);

      // Get the next display order for this media type
      const { data: existingMedia } = await supabase
        .from("media_assets")
        .select("display_order")
        .eq("athlete_id", athleteId)
        .eq("media_type", mediaType)
        .order("display_order", { ascending: false })
        .limit(1);

      const nextDisplayOrder = existingMedia && existingMedia.length > 0 
        ? (existingMedia[0].display_order || 0) + 1 
        : 1;

      // Delete old video if exists (only for intro/community)
      if (mediaType !== "game_video") {
        const existingVideo = mediaType === "introduction_video" ? introVideo : communityVideo;
        if (existingVideo) {
          await supabase
            .from("media_assets")
            .delete()
            .eq("id", existingVideo.id);

          const oldPath = existingVideo.url.split("/media-assets/")[1];
          if (oldPath) {
            await supabase.storage.from("media-assets").remove([oldPath]);
          }
        }
      }

      const { error: insertError } = await supabase
        .from("media_assets")
        .insert({
          user_id: user.id,
          athlete_id: athleteId,
          title,
          description,
          media_type: mediaType,
          url: publicUrl,
          file_size: file.size,
          display_order: nextDisplayOrder,
          season: season || null
        });

      if (insertError) throw insertError;

      toast.success("Video uploaded successfully!");
      await loadMediaAssets();
      onSuccess?.();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleAddVideoLink = async (
    url: string,
    title: string,
    description: string,
    season: string = ""
  ) => {
    if (!athleteId) return;

    // Check free tier limit
    if (isFree && totalVideos >= 1) {
      showUpgradePrompt({
        title: "Video Upload Limit Reached",
        description: "Free tier is limited to 1 video. Upgrade to add unlimited game videos!",
        feature: "Unlimited Video Links",
        context: "limit",
        benefits: [
          "Add unlimited game highlight links",
          "Connect YouTube, Hudl, and other platforms",
          "Build a comprehensive recruiting portfolio",
          "Increase visibility to college coaches",
        ]
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the next display order for game videos
      const { data: existingMedia } = await supabase
        .from("media_assets")
        .select("display_order")
        .eq("athlete_id", athleteId)
        .eq("media_type", "game_video")
        .order("display_order", { ascending: false })
        .limit(1);

      const nextDisplayOrder = existingMedia && existingMedia.length > 0 
        ? (existingMedia[0].display_order || 0) + 1 
        : 1;

      const { error } = await supabase
        .from("media_assets")
        .insert({
          user_id: user.id,
          athlete_id: athleteId,
          title,
          description,
          media_type: "game_video",
          url,
          display_order: nextDisplayOrder,
          season: season || null
        });

      if (error) throw error;

      toast.success("Video link added successfully!");
      loadMediaAssets();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdate = async (
    videoId: string,
    title: string,
    description: string,
    season: string = ""
  ) => {
    try {
      const { error } = await supabase
        .from("media_assets")
        .update({ 
          title, 
          description,
          season: season || null
        })
        .eq("id", videoId);

      if (error) throw error;

      toast.success("Video updated successfully!");
      setEditingVideo(null);
      loadMediaAssets();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (mediaAsset: MediaAsset) => {
    try {
      const { error: deleteError } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", mediaAsset.id);

      if (deleteError) throw deleteError;

      // Only try to delete from storage if it's a stored file (not a link)
      if (mediaAsset.url.includes("/media-assets/")) {
        const filePath = mediaAsset.url.split("/media-assets/")[1];
        if (filePath) {
          await supabase.storage.from("media-assets").remove([filePath]);
        }
      }

      toast.success("Video deleted successfully!");
      loadMediaAssets();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReorder = async (videoId: string, direction: "up" | "down") => {
    const currentVideos = [...gameVideos];
    const currentIndex = currentVideos.findIndex(v => v.id === videoId);
    
    if (currentIndex === -1) return;
    if (direction === "up" && currentIndex === 0) return;
    if (direction === "down" && currentIndex === currentVideos.length - 1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    // Swap the videos
    [currentVideos[currentIndex], currentVideos[newIndex]] = 
    [currentVideos[newIndex], currentVideos[currentIndex]];

    // Update the UI immediately
    setGameVideos(currentVideos);

    try {
      // Update both videos' display_order in the database
      const updates = currentVideos.map((video, index) => 
        supabase
          .from("media_assets")
          .update({ display_order: index + 1 })
          .eq("id", video.id)
      );

      await Promise.all(updates);
      toast.success("Video order updated!");
    } catch (error: any) {
      toast.error(error.message);
      // Reload to restore correct order
      loadMediaAssets();
    }
  };

  const VideoUploadCard = ({
    type,
    title,
    description,
    currentVideo
  }: {
    type: "introduction_video" | "community_video";
    title: string;
    description: string;
    currentVideo: MediaAsset | null;
  }) => {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoTitle, setVideoTitle] = useState("");
    const [videoDesc, setVideoDesc] = useState("");

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentVideo ? (
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  src={currentVideo.url}
                  controls
                  className="w-full h-full"
                />
              </div>
              <div>
                <h4 className="font-semibold">{currentVideo.title}</h4>
                {currentVideo.description && (
                  <p className="text-sm text-muted-foreground">{currentVideo.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingVideo(currentVideo)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(currentVideo)}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {uploading && (
                <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">Uploading video, please wait...</span>
                </div>
              )}
              <div>
                <Label htmlFor={`${type}-file`}>Video File</Label>
                <Input
                  id={`${type}-file`}
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                />
              </div>
              <div>
                <Label htmlFor={`${type}-title`}>Title</Label>
                <Input
                  id={`${type}-title`}
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Enter video title"
                  disabled={uploading}
                />
              </div>
              <div>
                <Label htmlFor={`${type}-desc`}>Description (Optional)</Label>
                <Textarea
                  id={`${type}-desc`}
                  value={videoDesc}
                  onChange={(e) => setVideoDesc(e.target.value)}
                  placeholder="Describe your video"
                  rows={3}
                  disabled={uploading}
                />
              </div>
              <Button
                onClick={async () => {
                  if (videoFile && videoTitle) {
                    const success = await handleUpload(videoFile, type, videoTitle, videoDesc, "", () => {
                      setVideoFile(null);
                      setVideoTitle("");
                      setVideoDesc("");
                    });
                    if (!success) {
                      // Only reset on success via callback, errors keep form intact
                    }
                  } else {
                    toast.error("Please select a file and enter a title");
                  }
                }}
                disabled={uploading || !videoFile || !videoTitle}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Video
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const AddGameVideoDialog = () => {
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [season, setSeason] = useState("");
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [mode, setMode] = useState<"link" | "upload">("link");
    const [open, setOpen] = useState(false);

    const resetForm = () => {
      setUrl("");
      setTitle("");
      setDescription("");
      setSeason("");
      setVideoFile(null);
      setMode("link");
    };

    const handleLinkSubmit = () => {
      if (url && title) {
        handleAddVideoLink(url, title, description, season);
        resetForm();
        setOpen(false);
      } else {
        toast.error("Please enter a video link and title");
      }
    };

    const handleUploadSubmit = async () => {
      if (videoFile && title) {
        const success = await handleUpload(videoFile, "game_video", title, description, season, () => {
          resetForm();
          setOpen(false);
        });
        if (!success) {
          // Keep form intact on error
        }
      } else {
        toast.error("Please select a file and enter a title");
      }
    };

    return (
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Game Video
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Game Video</DialogTitle>
            <DialogDescription>
              Upload a video file or add a link from YouTube, Hudl, or other platforms
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-2 mb-4">
            <Button
              variant={mode === "link" ? "default" : "outline"}
              onClick={() => setMode("link")}
              className="flex-1"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Link
            </Button>
            <Button
              variant={mode === "upload" ? "default" : "outline"}
              onClick={() => setMode("upload")}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>

          {uploading && (
            <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg mb-4">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Uploading video, please wait...</span>
            </div>
          )}

          <div className="space-y-4">
            {mode === "link" ? (
              <>
                <div>
                  <Label htmlFor="video-url">Video Link</Label>
                  <Input
                    id="video-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    disabled={uploading}
                  />
                </div>
                <div>
                  <Label htmlFor="video-title">Title</Label>
                  <Input
                    id="video-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Championship Game Highlights"
                    disabled={uploading}
                  />
                </div>
                <div>
                  <Label htmlFor="video-season">Season</Label>
                  <Input
                    id="video-season"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    placeholder="e.g., 2024 Fall, Spring 2023"
                    disabled={uploading}
                  />
                </div>
                <div>
                  <Label htmlFor="video-desc">Description (Optional)</Label>
                  <Textarea
                    id="video-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the game or your performance"
                    rows={3}
                    disabled={uploading}
                  />
                </div>
                <Button onClick={handleLinkSubmit} className="w-full" disabled={uploading}>
                  Add Video Link
                </Button>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="game-video-file">Video File</Label>
                  <Input
                    id="game-video-file"
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                  />
                </div>
                <div>
                  <Label htmlFor="upload-title">Title</Label>
                  <Input
                    id="upload-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Championship Game Highlights"
                    disabled={uploading}
                  />
                </div>
                <div>
                  <Label htmlFor="upload-season">Season</Label>
                  <Input
                    id="upload-season"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    placeholder="e.g., 2024 Fall, Spring 2023"
                    disabled={uploading}
                  />
                </div>
                <div>
                  <Label htmlFor="upload-desc">Description (Optional)</Label>
                  <Textarea
                    id="upload-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the game or your performance"
                    rows={3}
                    disabled={uploading}
                  />
                </div>
                <Button
                  onClick={handleUploadSubmit}
                  className="w-full"
                  disabled={uploading || !videoFile || !title}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Video
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const EditVideoDialog = ({ video }: { video: MediaAsset | null }) => {
    const [title, setTitle] = useState(video?.title || "");
    const [description, setDescription] = useState(video?.description || "");
    const [season, setSeason] = useState(video?.season || "");

    useEffect(() => {
      if (video) {
        setTitle(video.title);
        setDescription(video.description || "");
        setSeason(video.season || "");
      }
    }, [video]);

    if (!video) return null;

    return (
      <Dialog open={!!editingVideo} onOpenChange={(open) => !open && setEditingVideo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Video</DialogTitle>
            <DialogDescription>
              Update the details of your video
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            {video.media_type === "game_video" && (
              <div>
                <Label htmlFor="edit-season">Season</Label>
                <Input
                  id="edit-season"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  placeholder="e.g., 2024 Fall, Spring 2023"
                />
              </div>
            )}
            <div>
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={() => handleUpdate(video.id, title, description, season)}
              className="w-full"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Media Gallery</h1>
              <p className="text-muted-foreground">
                Manage your videos to showcase your skills and personality to college coaches
              </p>
            </div>
            {isFree && (
              <Badge variant="outline" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                {totalVideos}/1 Videos
              </Badge>
            )}
          </div>
        </div>

        <UpgradePromptDialog
          open={isOpen}
          onOpenChange={closeUpgradePrompt}
          title={config.title}
          description={config.description}
          feature={config.feature}
          benefits={config.benefits}
          context={config.context}
        />

        <div className="grid gap-6">
          <VideoUploadCard
            type="introduction_video"
            title="Introduction Video"
            description="Share a video introducing yourself to college coaches and recruiters"
            currentVideo={introVideo}
          />

          <VideoUploadCard
            type="community_video"
            title="Community Involvement Video"
            description="Showcase your community service work and leadership outside of sports"
            currentVideo={communityVideo}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Game Highlights
              </CardTitle>
              <CardDescription>
                Upload videos or add links from YouTube, Hudl, or other platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {gameVideos.length > 0 ? (
                <div className="space-y-4">
                  {gameVideos.map((video) => (
                    <Card key={video.id} className="p-4">
                       <div className="space-y-3">
                        {video.url.includes("/media-assets/") ? (
                          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                            <video
                              src={video.url}
                              controls
                              className="w-full h-full"
                            />
                          </div>
                        ) : null}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold flex items-center gap-2">
                                {video.title}
                                {!video.url.includes("/media-assets/") && (
                                  <a
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/80"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                              </h4>
                              {video.season && (
                                <Badge variant="secondary" className="text-xs">
                                  {video.season}
                                </Badge>
                              )}
                            </div>
                            {video.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {video.description}
                              </p>
                            )}
                            {!video.url.includes("/media-assets/") && (
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <LinkIcon className="h-3 w-3" />
                                {video.url}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReorder(video.id, "up")}
                              disabled={gameVideos.indexOf(video) === 0}
                              title="Move up"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReorder(video.id, "down")}
                              disabled={gameVideos.indexOf(video) === gameVideos.length - 1}
                              title="Move down"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingVideo(video)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(video)}
                            className="flex-1"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No game videos added yet. Click below to add your first highlight reel!
                </p>
              )}
              <AddGameVideoDialog />
            </CardContent>
          </Card>
        </div>
      </div>

      <EditVideoDialog video={editingVideo} />
    </div>
  );
};

export default MediaGallery;