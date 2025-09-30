import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, Image as ImageIcon, Send, Edit, Trash2, Eye, Share2, Facebook, Twitter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SocialPost {
  id: string;
  content: string;
  media_url: string | null;
  is_draft: boolean;
  published_at: string | null;
  watermark_applied: boolean;
  created_at: string;
}

const PLATFORM_LIMITS = {
  twitter: 280,
  facebook: 63206,
  instagram: 2200,
  tiktok: 2200,
};

const FORSWAGS_TAG = "#ForSWAGsNation";
const FORSWAGS_HANDLES = {
  twitter: "@ForSWAGs",
  facebook: "@ForSWAGs",
  instagram: "@ForSWAGs",
  tiktok: "@ForSWAGs",
};

export default function SocialMedia() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [formData, setFormData] = useState({
    content: "",
    media_url: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("social_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (isDraft: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const postData = {
        content: formData.content,
        media_url: formData.media_url || null,
        is_draft: isDraft,
        published_at: isDraft ? null : new Date().toISOString(),
        user_id: user.id,
      };

      if (editingPost) {
        const { error } = await supabase
          .from("social_posts")
          .update(postData)
          .eq("id", editingPost.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Post updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("social_posts")
          .insert([postData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: isDraft ? "Draft saved" : "Post published",
        });
      }

      setIsDialogOpen(false);
      setFormData({ content: "", media_url: "" });
      setEditingPost(null);
      fetchPosts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("social_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Post deleted",
      });
      fetchPosts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (post: SocialPost) => {
    setEditingPost(post);
    setFormData({
      content: post.content,
      media_url: post.media_url || "",
    });
    setIsDialogOpen(true);
  };

  const handlePublish = async (post: SocialPost) => {
    try {
      const { error } = await supabase
        .from("social_posts")
        .update({
          is_draft: false,
          published_at: new Date().toISOString(),
        })
        .eq("id", post.id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Post published",
      });
      fetchPosts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish post",
        variant: "destructive",
      });
    }
  };

  const formatPostForPlatform = (content: string, platform: keyof typeof PLATFORM_LIMITS): string => {
    const limit = PLATFORM_LIMITS[platform];
    const handle = FORSWAGS_HANDLES[platform];
    const suffix = ` ${handle} ${FORSWAGS_TAG}`;
    
    const maxContentLength = limit - suffix.length;
    const truncatedContent = content.length > maxContentLength 
      ? content.substring(0, maxContentLength - 3) + "..." 
      : content;
    
    return `${truncatedContent}${suffix}`;
  };

  const shareToTwitter = (content: string) => {
    const formattedContent = formatPostForPlatform(content, "twitter");
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(formattedContent)}`;
    window.open(url, "_blank");
  };

  const shareToFacebook = (content: string) => {
    const formattedContent = formatPostForPlatform(content, "facebook");
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(formattedContent)}`;
    window.open(url, "_blank");
  };

  const shareToInstagram = (content: string) => {
    const formattedContent = formatPostForPlatform(content, "instagram");
    navigator.clipboard.writeText(formattedContent);
    toast({
      title: "Copied to clipboard",
      description: "Open Instagram and paste your post",
    });
  };

  const shareToTikTok = (content: string) => {
    const formattedContent = formatPostForPlatform(content, "tiktok");
    navigator.clipboard.writeText(formattedContent);
    toast({
      title: "Copied to clipboard",
      description: "Open TikTok and paste your post",
    });
  };

  const PostCard = ({ post }: { post: SocialPost }) => (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardDescription className="text-xs text-muted-foreground mb-2">
              {post.is_draft ? "Draft" : "Published"} • {new Date(post.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge variant={post.is_draft ? "secondary" : "default"}>
            {post.is_draft ? "Draft" : "Published"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {post.media_url && (
          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
            <img
              src={post.media_url}
              alt="Post media"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        
        {!post.is_draft && (
          <div className="border-t pt-4">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Share to platforms:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => shareToTwitter(post.content)}
              >
                <Twitter className="h-3 w-3 mr-1" />
                Twitter/X
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => shareToFacebook(post.content)}
              >
                <Facebook className="h-3 w-3 mr-1" />
                Facebook
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => shareToInstagram(post.content)}
              >
                <Share2 className="h-3 w-3 mr-1" />
                Instagram
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => shareToTikTok(post.content)}
              >
                <Share2 className="h-3 w-3 mr-1" />
                TikTok
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(post)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          {post.is_draft && (
            <Button
              size="sm"
              onClick={() => handlePublish(post)}
            >
              <Send className="h-4 w-4 mr-1" />
              Publish
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(post.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const drafts = posts.filter((p) => p.is_draft);
  const published = posts.filter((p) => !p.is_draft);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Social Media</h1>
          <p className="text-muted-foreground">
            Create and manage your social media content
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPost(null);
              setFormData({ content: "", media_url: "" });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingPost ? "Edit Post" : "Create New Post"}</DialogTitle>
              <DialogDescription>
                Share your journey with your followers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="What's on your mind?"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="media">Media URL (optional)</Label>
                <div className="flex gap-2">
                  <ImageIcon className="h-5 w-5 text-muted-foreground mt-2" />
                  <Input
                    id="media"
                    placeholder="https://example.com/image.jpg"
                    value={formData.media_url}
                    onChange={(e) =>
                      setFormData({ ...formData, media_url: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
              >
                Save Draft
              </Button>
              <Button onClick={() => handleSubmit(false)}>
                <Send className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({posts.length})</TabsTrigger>
          <TabsTrigger value="published">Published ({published.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No posts yet</p>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Start creating engaging content to share with your audience
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="published" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {published.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drafts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
