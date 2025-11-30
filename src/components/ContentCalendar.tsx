import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Trash2, Edit2, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ScheduledPost {
  id: string;
  content: string;
  scheduled_for: string;
  status: string;
  platforms: string[];
  template_type?: string;
  hashtags?: string[];
}

export const ContentCalendar = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [content, setContent] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const { data: scheduledPosts, isLoading } = useQuery({
    queryKey: ['scheduled-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .order('scheduled_for', { ascending: true });
      
      if (error) throw error;
      return data as ScheduledPost[];
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: user.id,
          ...postData,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      toast.success('Post scheduled successfully!');
      resetForm();
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to schedule post: ' + error.message);
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from('scheduled_posts')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      toast.success('Post updated successfully!');
      setEditingPost(null);
      resetForm();
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to update post: ' + error.message);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      toast.success('Post deleted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to delete post: ' + error.message);
    },
  });

  const resetForm = () => {
    setContent("");
    setScheduledDate(undefined);
    setScheduledTime("12:00");
    setSelectedPlatforms([]);
    setEditingPost(null);
  };

  const handleSchedule = () => {
    if (!content.trim() || !scheduledDate || selectedPlatforms.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const scheduledDateTime = new Date(scheduledDate);
    const [hours, minutes] = scheduledTime.split(':');
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

    const postData = {
      content,
      scheduled_for: scheduledDateTime.toISOString(),
      platforms: selectedPlatforms,
      status: 'scheduled',
    };

    if (editingPost) {
      updatePostMutation.mutate({ id: editingPost.id, ...postData });
    } else {
      createPostMutation.mutate(postData);
    }
  };

  const handleEdit = (post: ScheduledPost) => {
    setEditingPost(post);
    setContent(post.content);
    setScheduledDate(new Date(post.scheduled_for));
    setScheduledTime(format(new Date(post.scheduled_for), 'HH:mm'));
    setSelectedPlatforms(post.platforms);
    setIsOpen(true);
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'posted': return 'secondary';
      case 'failed': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'default';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading calendar...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Content Calendar</CardTitle>
            <CardDescription>Schedule and manage your social media posts</CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Schedule Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingPost ? 'Edit Scheduled Post' : 'Schedule New Post'}</DialogTitle>
                <DialogDescription>
                  Plan your content ahead of time for consistent posting
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content">Post Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your post content..."
                    rows={6}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground">{content.length}/2000 characters</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Schedule Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {scheduledDate ? format(scheduledDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={scheduledDate}
                          onSelect={setScheduledDate}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Schedule Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Platforms</Label>
                  <div className="flex flex-wrap gap-2">
                    {['twitter', 'facebook', 'instagram', 'tiktok', 'linkedin'].map((platform) => (
                      <Badge
                        key={platform}
                        variant={selectedPlatforms.includes(platform) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => togglePlatform(platform)}
                      >
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { resetForm(); setIsOpen(false); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSchedule} disabled={createPostMutation.isPending || updatePostMutation.isPending}>
                    {editingPost ? 'Update' : 'Schedule'} Post
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scheduledPosts && scheduledPosts.length > 0 ? (
            scheduledPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(post.status)}>
                          {post.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(post.scheduled_for), 'PPP')}
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(post.scheduled_for), 'p')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                      <div className="flex flex-wrap gap-2">
                        {post.platforms.map((platform) => (
                          <Badge key={platform} variant="secondary" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {post.status === 'scheduled' && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(post)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePostMutation.mutate(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No scheduled posts yet. Start planning your content!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};