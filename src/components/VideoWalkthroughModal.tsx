import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { videoLibrary } from "@/config/tutorialSteps";
import { Button } from "@/components/ui/button";
import { Play, Clock } from "lucide-react";

interface VideoWalkthroughModalProps {
  videoId?: string;
  onClose?: () => void;
}

export const VideoWalkthroughModal = ({ videoId, onClose }: VideoWalkthroughModalProps) => {
  const [open, setOpen] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(videoId || null);

  useEffect(() => {
    const handleOpenVideo = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setCurrentVideoId(customEvent.detail);
      setOpen(true);
    };

    window.addEventListener('open-tutorial-video', handleOpenVideo);
    return () => window.removeEventListener('open-tutorial-video', handleOpenVideo);
  }, []);

  useEffect(() => {
    if (videoId) {
      setCurrentVideoId(videoId);
      setOpen(true);
    }
  }, [videoId]);

  const handleClose = () => {
    setOpen(false);
    setCurrentVideoId(null);
    onClose?.();
  };

  const video = currentVideoId ? videoLibrary[currentVideoId] : null;

  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            {video.title}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {video.duration}
          </div>
        </DialogHeader>
        
        <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
          <iframe
            src={video.url}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Standalone component for triggering video from any step
export const VideoWalkthroughButton = ({ videoId }: { videoId: string }) => {
  const video = videoLibrary[videoId];
  
  if (!video) return null;

  const handleClick = () => {
    const event = new CustomEvent('open-tutorial-video', { detail: videoId });
    window.dispatchEvent(event);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="w-full sm:w-auto"
    >
      <Play className="h-4 w-4 mr-2" />
      Watch: {video.title}
    </Button>
  );
};
