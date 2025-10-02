import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Download, Eye, Archive, Video, Image, Clock } from "lucide-react";
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
  const [filteredMedia, setFilteredMedia] = useState<ArchivedMedia[]>([]);

  useEffect(() => {
    loadArchivedMedia();
  }, []);

  useEffect(() => {
    if (searchEmail) {
      setFilteredMedia(
        archivedMedia.filter(m => 
          m.user_email?.toLowerCase().includes(searchEmail.toLowerCase()) ||
          m.athlete_name?.toLowerCase().includes(searchEmail.toLowerCase())
        )
      );
    } else {
      setFilteredMedia(archivedMedia);
    }
  }, [searchEmail, archivedMedia]);

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
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or athlete name..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="max-w-sm"
            />
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
                          >
                            <Eye className="h-4 w-4" />
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
            <span>Total archived items: {filteredMedia.length}</span>
            <span>
              Deleted: {filteredMedia.filter(m => m.is_deleted).length} | 
              Archived: {filteredMedia.filter(m => !m.is_deleted).length}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
