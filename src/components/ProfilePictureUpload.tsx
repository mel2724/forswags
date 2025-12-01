import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Trash2 } from "lucide-react";

interface ProfilePictureUploadProps {
  currentImageUrl: string | null;
  onImageUpdate: (url: string | null) => void;
  userInitials: string;
  size?: "sm" | "md" | "lg";
}

export default function ProfilePictureUpload({
  currentImageUrl,
  onImageUpdate,
  userInitials,
  size = "md"
}: ProfilePictureUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32"
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete old image if exists
      if (currentImageUrl) {
        const oldPath = currentImageUrl.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("profile-pictures")
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new image
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);

      onImageUpdate(publicUrl);

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!currentImageUrl) return;

    try {
      setDeleting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const oldPath = currentImageUrl.split("/").pop();
      if (oldPath) {
        const { error } = await supabase.storage
          .from("profile-pictures")
          .remove([`${user.id}/${oldPath}`]);

        if (error) throw error;
      }

      onImageUpdate(null);

      toast({
        title: "Success",
        description: "Profile picture removed",
      });
    } catch (error: any) {
      console.error("Error deleting image:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to remove profile picture",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>Profile Picture</Label>
      <div className="flex items-center gap-4">
        <Avatar className={`${sizeClasses[size]} border-4 border-primary`}>
          <AvatarImage src={currentImageUrl || undefined} alt="Profile" />
          <AvatarFallback className="text-xl bg-primary text-primary-foreground">
            {userInitials}
          </AvatarFallback>
        </Avatar>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || deleting}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                {currentImageUrl ? "Change" : "Upload"}
              </>
            )}
          </Button>

          {currentImageUrl && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={uploading || deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Recommended: Square image, at least 200x200px, under 5MB
      </p>
    </div>
  );
}
