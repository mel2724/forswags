import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, X, Shield } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TeamLogoUploadProps {
  userId: string;
  currentLogoUrl: string | null;
  onLogoChange: (url: string | null) => void;
  hasPremiumAccess: boolean;
}

export function TeamLogoUpload({ 
  userId, 
  currentLogoUrl, 
  onLogoChange,
  hasPremiumAccess 
}: TeamLogoUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasPremiumAccess) {
      toast.error("Team logo upload is available for paid members only");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploading(true);

    try {
      // Delete old logo if exists
      if (currentLogoUrl) {
        const oldPath = currentLogoUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('team-logos').remove([oldPath]);
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/team-logo-${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('team-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('team-logos')
        .getPublicUrl(fileName);

      onLogoChange(publicUrl);
      toast.success("Team logo uploaded successfully!");
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(error.message || "Failed to upload team logo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentLogoUrl) return;

    try {
      const path = currentLogoUrl.split('/').slice(-2).join('/');
      const { error } = await supabase.storage
        .from('team-logos')
        .remove([path]);

      if (error) throw error;

      onLogoChange(null);
      toast.success("Team logo removed");
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast.error("Failed to remove team logo");
    }
  };

  if (!hasPremiumAccess) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-yellow-600" />
          Team Logo
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
            Premium
          </span>
        </Label>
        <div className="p-4 border-2 border-dashed border-yellow-200 rounded-lg bg-yellow-50/50 text-center">
          <Shield className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
          <p className="text-sm text-muted-foreground">
            Upgrade to a paid membership to upload your team logo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        Team Logo
        <span className="text-xs text-muted-foreground">(Optional)</span>
      </Label>
      
      <div className="flex items-center gap-4">
        {currentLogoUrl && (
          <Avatar className="h-20 w-20 border-2 border-border">
            <AvatarImage src={currentLogoUrl} alt="Team logo" />
            <AvatarFallback>Logo</AvatarFallback>
          </Avatar>
        )}

        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
              id="team-logo-upload"
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => document.getElementById('team-logo-upload')?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : currentLogoUrl ? "Change Logo" : "Upload Logo"}
            </Button>
          </div>

          {currentLogoUrl && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Recommended: Square image, at least 200x200px, max 2MB
      </p>
    </div>
  );
}
