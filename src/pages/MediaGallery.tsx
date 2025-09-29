import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Upload, Trash2, Video } from "lucide-react";

interface MediaAsset {
  id: string;
  title: string;
  description: string | null;
  url: string;
  media_type: string;
  created_at: string;
}

const MediaGallery = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [introVideo, setIntroVideo] = useState<MediaAsset | null>(null);
  const [communityVideo, setCommunityVideo] = useState<MediaAsset | null>(null);
  const [athleteId, setAthleteId] = useState<string | null>(null);

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
        .in("media_type", ["introduction_video", "community_video"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (media) {
        setIntroVideo(media.find(m => m.media_type === "introduction_video") || null);
        setCommunityVideo(media.find(m => m.media_type === "community_video") || null);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (
    file: File,
    mediaType: "introduction_video" | "community_video",
    title: string,
    description: string
  ) => {
    if (!athleteId) return;

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${mediaType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("media-assets")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media-assets")
        .getPublicUrl(fileName);

      // Delete old video if exists
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

      const { error: insertError } = await supabase
        .from("media_assets")
        .insert({
          user_id: user.id,
          athlete_id: athleteId,
          title,
          description,
          media_type: mediaType,
          url: publicUrl,
          file_size: file.size
        });

      if (insertError) throw insertError;

      toast.success("Video uploaded successfully!");
      loadMediaAssets();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaAsset: MediaAsset) => {
    try {
      const { error: deleteError } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", mediaAsset.id);

      if (deleteError) throw deleteError;

      const filePath = mediaAsset.url.split("/media-assets/")[1];
      if (filePath) {
        await supabase.storage.from("media-assets").remove([filePath]);
      }

      toast.success("Video deleted successfully!");
      loadMediaAssets();
    } catch (error: any) {
      toast.error(error.message);
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
              <Button
                variant="destructive"
                onClick={() => handleDelete(currentVideo)}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Video
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor={`${type}-file`}>Video File</Label>
                <Input
                  id={`${type}-file`}
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <Label htmlFor={`${type}-title`}>Title</Label>
                <Input
                  id={`${type}-title`}
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Enter video title"
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
                />
              </div>
              <Button
                onClick={() => {
                  if (videoFile && videoTitle) {
                    handleUpload(videoFile, type, videoTitle, videoDesc);
                    setVideoFile(null);
                    setVideoTitle("");
                    setVideoDesc("");
                  } else {
                    toast.error("Please select a file and enter a title");
                  }
                }}
                disabled={uploading || !videoFile || !videoTitle}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
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
          <h1 className="text-4xl font-bold mb-2">Media Gallery</h1>
          <p className="text-muted-foreground">
            Upload your introduction and community involvement videos to showcase your personality and values
          </p>
        </div>

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
        </div>
      </div>
    </div>
  );
};

export default MediaGallery;
