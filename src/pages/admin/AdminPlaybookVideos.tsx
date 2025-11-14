import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, PlayCircle, ExternalLink, Upload, BarChart3, Eye, Users, CheckCircle, TrendingUp } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  external_link: string | null;
  duration_minutes: number | null;
  order_index: number;
  module_id: string;
  module_title?: string;
  view_count?: number;
}

interface VideoAnalytics {
  lesson_id: string;
  video_title: string;
  topic_title: string;
  total_views: number;
  unique_viewers: number;
  completed_views: number;
  avg_watch_duration: number;
  views_last_7_days: number;
  views_last_30_days: number;
  last_viewed_at: string;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
}

export default function AdminPlaybookVideos() {
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<VideoAnalytics[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    external_link: "",
    duration_minutes: "",
    module_id: "",
    order_index: "",
  });

  const [moduleFormData, setModuleFormData] = useState({
    title: "",
    description: "",
    order_index: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Find or create "Playbook for Life" course
      let { data: course, error: courseError } = await supabase
        .from("courses")
        .select("id")
        .ilike("title", "%playbook%")
        .single();

      if (courseError || !course) {
        const { data: newCourse, error: createError } = await supabase
          .from("courses")
          .insert({
            title: "The Playbook for Life",
            description: "Essential life skills videos for athletes",
            is_published: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        course = newCourse;
      }

      setCourseId(course.id);

      // Load modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("id, title, description")
        .eq("course_id", course.id)
        .order("order_index", { ascending: true });

      if (modulesError) throw modulesError;
      setModules(modulesData || []);

      // Load videos
      const { data: videosData, error: videosError } = await supabase
        .from("lessons")
        .select(`
          id,
          title,
          description,
          video_url,
          thumbnail_url,
          external_link,
          duration_minutes,
          order_index,
          module_id,
          view_count,
          modules!inner(title)
        `)
        .not("video_url", "is", null)
        .in("module_id", (modulesData || []).map(m => m.id))
        .order("order_index", { ascending: true });

      // Load analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from("playbook_video_analytics")
        .select("*");

      if (videosError) throw videosError;
      if (analyticsError) console.error("Error loading analytics:", analyticsError);

      const formattedVideos = videosData?.map((v: any) => ({
        ...v,
        module_title: v.modules?.title,
      })) || [];

      setVideos(formattedVideos);
      setAnalytics(analyticsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load Playbook videos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = async () => {
    if (!courseId) return;

    try {
      const { error } = await supabase
        .from("modules")
        .insert({
          title: moduleFormData.title,
          description: moduleFormData.description || null,
          order_index: parseInt(moduleFormData.order_index) || 0,
          course_id: courseId,
        });

      if (error) throw error;

      toast({ title: "Success", description: "Topic added successfully" });
      setIsModuleDialogOpen(false);
      setModuleFormData({ title: "", description: "", order_index: "" });
      loadData();
    } catch (error) {
      console.error("Error adding module:", error);
      toast({ title: "Error", description: "Failed to add topic", variant: "destructive" });
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadingFile(true);

      // Create unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `playbook-videos/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('playbook-videos')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('playbook-videos')
        .getPublicUrl(filePath);

      // Update form data with the uploaded URL
      setFormData({ ...formData, video_url: publicUrl });
      setSelectedFile(null);

      toast({ 
        title: "Success", 
        description: "Video file uploaded successfully" 
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({ 
        title: "Error", 
        description: "Failed to upload video file", 
        variant: "destructive" 
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleThumbnailSelect = (file: File | null) => {
    setSelectedThumbnail(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setThumbnailPreview(null);
    }
  };

  const handleThumbnailUpload = async () => {
    if (!selectedThumbnail) return;

    try {
      setUploadingThumbnail(true);

      // Create unique filename
      const fileExt = selectedThumbnail.name.split('.').pop();
      const fileName = `thumb-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `playbook-videos/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('playbook-videos')
        .upload(filePath, selectedThumbnail);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('playbook-videos')
        .getPublicUrl(filePath);

      // Update form data with the uploaded URL
      setFormData({ ...formData, thumbnail_url: publicUrl });
      setSelectedThumbnail(null);

      toast({ 
        title: "Success", 
        description: "Thumbnail uploaded successfully" 
      });
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      toast({ 
        title: "Error", 
        description: "Failed to upload thumbnail", 
        variant: "destructive" 
      });
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const videoData = {
        title: formData.title,
        description: formData.description || null,
        video_url: formData.video_url,
        thumbnail_url: formData.thumbnail_url || null,
        external_link: formData.external_link || null,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        module_id: formData.module_id,
        order_index: parseInt(formData.order_index) || 0,
        is_scorm_content: false,
      };

      if (editingVideo) {
        const { error } = await supabase
          .from("lessons")
          .update(videoData)
          .eq("id", editingVideo.id);

        if (error) throw error;
        toast({ title: "Success", description: "Video updated successfully" });
      } else {
        const { error } = await supabase
          .from("lessons")
          .insert(videoData);

        if (error) throw error;
        toast({ title: "Success", description: "Video added successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving video:", error);
      toast({ title: "Error", description: "Failed to save video", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Success", description: "Video deleted successfully" });
      loadData();
    } catch (error) {
      console.error("Error deleting video:", error);
      toast({ title: "Error", description: "Failed to delete video", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      video_url: "",
      thumbnail_url: "",
      external_link: "",
      duration_minutes: "",
      module_id: "",
      order_index: "",
    });
    setEditingVideo(null);
    setSelectedFile(null);
    setSelectedThumbnail(null);
    setThumbnailPreview(null);
  };

  const openEditDialog = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || "",
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || "",
      external_link: video.external_link || "",
      duration_minutes: video.duration_minutes?.toString() || "",
      module_id: video.module_id,
      order_index: video.order_index.toString(),
    });
    setThumbnailPreview(video.thumbnail_url);
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  const getVideoAnalytics = (videoId: string) => {
    return analytics.find(a => a.lesson_id === videoId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Playbook for Life Videos</h1>
          <p className="text-muted-foreground">Manage life skills video content</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showAnalytics ? "default" : "outline"}
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showAnalytics ? "Hide" : "Show"} Analytics
          </Button>
          <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Topic
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Topic</DialogTitle>
                <DialogDescription>Create a new life skills topic</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Topic Name *</Label>
                  <Input
                    placeholder="e.g., Focus, Respect, Finances"
                    value={moduleFormData.title}
                    onChange={(e) => setModuleFormData({ ...moduleFormData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Topic description"
                    value={moduleFormData.description}
                    onChange={(e) => setModuleFormData({ ...moduleFormData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Order</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={moduleFormData.order_index}
                    onChange={(e) => setModuleFormData({ ...moduleFormData, order_index: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddModule} className="w-full">
                  Add Topic
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingVideo ? "Edit Video" : "Add New Video"}</DialogTitle>
                <DialogDescription>
                  Add a video to The Playbook for Life
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pb-4">
                <div>
                  <Label>Topic *</Label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={formData.module_id}
                    onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                  >
                    <option value="">Select topic...</option>
                    {modules.map(module => (
                      <option key={module.id} value={module.id}>{module.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Video Title *</Label>
                  <Input
                    placeholder="e.g., Building Strong Friendships"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Upload Video File</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      disabled={uploadingFile}
                    />
                    <Button
                      type="button"
                      onClick={handleFileUpload}
                      disabled={!selectedFile || uploadingFile}
                      variant="outline"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingFile ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a video file or enter a URL below
                  </p>
                </div>

                <div>
                  <Label>Video URL (YouTube/Vimeo Embed or Uploaded) *</Label>
                  <Input
                    placeholder="https://www.youtube.com/embed/... or upload file above"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Video Thumbnail</Label>
                  {thumbnailPreview && (
                    <div className="mb-2">
                      <img 
                        src={thumbnailPreview} 
                        alt="Thumbnail preview" 
                        className="w-full max-w-xs rounded-md border"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleThumbnailSelect(e.target.files?.[0] || null)}
                      disabled={uploadingThumbnail}
                    />
                    <Button
                      type="button"
                      onClick={handleThumbnailUpload}
                      disabled={!selectedThumbnail || uploadingThumbnail}
                      variant="outline"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingThumbnail ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a thumbnail image for the video
                  </p>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="What will viewers learn from this video?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>External Link (Optional)</Label>
                  <Input
                    placeholder="https://... (link for more resources)"
                    value={formData.external_link}
                    onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Order</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.order_index}
                      onChange={(e) => setFormData({ ...formData, order_index: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingVideo ? "Update Video" : "Add Video"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Analytics Overview */}
      {showAnalytics && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {analytics.reduce((sum, a) => sum + Number(a.total_views), 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Unique Viewers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {analytics.reduce((sum, a) => sum + Number(a.unique_viewers), 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {analytics.reduce((sum, a) => sum + Number(a.completed_views), 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Views (7 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {analytics.reduce((sum, a) => sum + Number(a.views_last_7_days), 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Topics Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        {modules.map(module => {
          const moduleVideos = videos.filter(v => v.module_id === module.id);
          const moduleViews = moduleVideos.reduce((sum, v) => sum + (v.view_count || 0), 0);
          return (
            <Card key={module.id}>
              <CardHeader>
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <CardDescription>
                  {moduleVideos.length} videos
                  {showAnalytics && ` • ${moduleViews} views`}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Videos Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Videos</CardTitle>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <PlayCircle className="h-12 w-12 mx-auto mb-4" />
              <p>No videos added yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Thumbnail</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Video Title</TableHead>
                  <TableHead>Duration</TableHead>
                  {showAnalytics && (
                    <>
                      <TableHead>Views</TableHead>
                      <TableHead>Unique</TableHead>
                      <TableHead>Completed</TableHead>
                    </>
                  )}
                  <TableHead>Links</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video) => {
                  const videoStats = getVideoAnalytics(video.id);
                  return (
                    <TableRow key={video.id}>
                      <TableCell>{video.order_index}</TableCell>
                      <TableCell>
                        {video.thumbnail_url ? (
                          <img 
                            src={video.thumbnail_url} 
                            alt={video.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                            <PlayCircle className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{video.module_title}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{video.title}</TableCell>
                      <TableCell>{video.duration_minutes ? `${video.duration_minutes} min` : "—"}</TableCell>
                      {showAnalytics && (
                        <>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3 text-muted-foreground" />
                              {videoStats?.total_views || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              {videoStats?.unique_viewers || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-muted-foreground" />
                              {videoStats?.completed_views || 0}
                            </div>
                          </TableCell>
                        </>
                      )}
                    <TableCell>
                      <div className="flex gap-2">
                        {video.video_url && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => window.open(video.video_url, '_blank')}
                          >
                            <PlayCircle className="h-3 w-3" />
                          </Button>
                        )}
                        {video.external_link && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => window.open(video.external_link!, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(video)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDelete(video.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}