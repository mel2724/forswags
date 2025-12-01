import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Download, Eye, Archive, Video, Image, Clock, RotateCcw, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ArchivedMedia {
  id: string;
  original_media_id: string;
  user_id: string;
  athlete_id: string | null;
  media_type: string;
  storage_path: string;
  file_name: string;
  version_number: number;
  archived_reason: string;
  archived_at: string;
  is_deleted: boolean;
  user_email: string;
  athlete_name: string;
}

export default function AdminArchivedMedia() {
  const [archivedMedia, setArchivedMedia] = useState<ArchivedMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filteredMedia, setFilteredMedia] = useState<ArchivedMedia[]>([]);
  const [restoringMedia, setRestoringMedia] = useState<ArchivedMedia | null>(null);
  const [deletingMedia, setDeletingMedia] = useState<ArchivedMedia | null>(null);

  useEffect(() => {
    loadArchivedMedia();
  }, []);

  useEffect(() => {
    let filtered = archivedMedia;

    // Search filter
    if (searchEmail) {
      filtered = filtered.filter(m => 
        m.user_email?.toLowerCase().includes(searchEmail.toLowerCase()) ||
        m.athlete_name?.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    // Media type filter
    if (mediaTypeFilter !== "all") {
      filtered = filtered.filter(m => m.media_type === mediaTypeFilter);
    }

    // Reason filter
    if (reasonFilter !== "all") {
      filtered = filtered.filter(m => m.archived_reason === reasonFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "deleted") {
        filtered = filtered.filter(m => m.is_deleted);
      } else {
        filtered = filtered.filter(m => !m.is_deleted);
      }
    }

    setFilteredMedia(filtered);
  }, [searchEmail, mediaTypeFilter, reasonFilter, statusFilter, archivedMedia]);

  const loadArchivedMedia = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('admin_get_archived_media', {
        p_limit: 500
      });

      if (error) throw error;
      setArchivedMedia(data || []);
    } catch (error: any) {
      console.error('Error loading archived media:', error);
      toast.error('Failed to load archived media');
    } finally {
      setLoading(false);
    }
  };

  const getMediaIcon = (mediaType: string) => {
    if (mediaType.includes('video') || mediaType === 'highlight') {
      return <Video className="h-4 w-4" />;
    }
    return <Image className="h-4 w-4" />;
  };

  const getReasonBadge = (reason: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      account_archived: "secondary",
      media_updated: "default",
      media_deleted: "destructive",
    };
    return (
      <Badge variant={variants[reason] || "default"}>
        {reason.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const handleRestore = async () => {
    if (!restoringMedia) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      const response = await supabase.functions.invoke('admin-restore-archived-media', {
        body: { archivedMediaId: restoringMedia.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to restore media");
      }

      toast.success("Media restored successfully");
      setRestoringMedia(null);
      loadArchivedMedia();
    } catch (error) {
      console.error("Error restoring media:", error);
      toast.error(error instanceof Error ? error.message : "Failed to restore media");
    }
  };

  const handleDelete = async () => {
    if (!deletingMedia) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      const response = await supabase.functions.invoke('admin-delete-archived-media', {
        body: { archivedMediaId: deletingMedia.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to delete media");
      }

      toast.success("Media permanently deleted");
      setDeletingMedia(null);
      loadArchivedMedia();
    } catch (error) {
      console.error("Error deleting media:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete media");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading archived media...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-6 w-6" />
                Archived Media
              </CardTitle>
              <CardDescription>
                View and manage all archived videos and images from canceled accounts and updates
              </CardDescription>
            </div>
            <Button onClick={loadArchivedMedia} variant="outline">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or athlete name..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
              />
            </div>
            
            <Select value={mediaTypeFilter} onValueChange={setMediaTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Media Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="highlight">Highlight</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="profile_picture">Profile Picture</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                <SelectItem value="account_archived">Account Archived</SelectItem>
                <SelectItem value="media_updated">Media Updated</SelectItem>
                <SelectItem value="media_deleted">Media Deleted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="archived">Archived Only</SelectItem>
                <SelectItem value="deleted">Deleted Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Archived</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedia.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No archived media found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMedia.map((media) => (
                    <TableRow key={media.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMediaIcon(media.media_type)}
                          <span className="text-sm">{media.media_type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {media.file_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{media.athlete_name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">{media.user_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">v{media.version_number}</Badge>
                      </TableCell>
                      <TableCell>{getReasonBadge(media.archived_reason)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(media.archived_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {media.is_deleted ? (
                          <Badge variant="destructive">Deleted</Badge>
                        ) : (
                          <Badge variant="secondary">Archived</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              toast.info('Storage path: ' + media.storage_path);
                            }}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!media.is_deleted && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRestoringMedia(media)}
                              title="Restore media"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeletingMedia(media)}
                            title="Permanently delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Total archived items: {filteredMedia.length} of {archivedMedia.length}</span>
            <span>
              Deleted: {filteredMedia.filter(m => m.is_deleted).length} | 
              Archived: {filteredMedia.filter(m => !m.is_deleted).length}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoringMedia} onOpenChange={(open) => !open && setRestoringMedia(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Archived Media?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore "{restoringMedia?.file_name}" back to the user's active media library. 
              The file will become accessible to the user again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMedia} onOpenChange={(open) => !open && setDeletingMedia(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Media?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingMedia?.file_name}" from storage. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
