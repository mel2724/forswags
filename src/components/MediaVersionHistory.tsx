import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, FileType } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface VersionHistoryProps {
  mediaId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface MediaVersion {
  version_number: number;
  storage_path: string;
  archived_at: string;
  archived_reason: string;
  file_size: number;
}

export function MediaVersionHistory({ mediaId, isOpen, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<MediaVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && mediaId) {
      loadVersionHistory();
    }
  }, [isOpen, mediaId]);

  const loadVersionHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_media_version_history', {
        p_media_id: mediaId,
      });

      if (error) throw error;
      setVersions(data || []);
    } catch (error: any) {
      console.error('Error loading version history:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Media Version History</DialogTitle>
          <DialogDescription>
            View all previous versions of this media file
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse">Loading versions...</div>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No version history available
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <div
                  key={version.version_number}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <Badge variant={version.version_number === versions[0].version_number ? "default" : "outline"}>
                      v{version.version_number}
                    </Badge>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <FileType className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {version.storage_path.split('/').pop()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Archived {formatDistanceToNow(new Date(version.archived_at), { addSuffix: true })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {version.archived_reason.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(version.file_size)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
