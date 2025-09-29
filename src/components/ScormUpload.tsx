import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileArchive, Loader2 } from "lucide-react";

interface ScormUploadProps {
  lessonId: string;
  onUploadComplete: () => void;
}

export const ScormUpload = ({ lessonId, onUploadComplete }: ScormUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [scormFile, setScormFile] = useState<File | null>(null);
  const [scormVersion, setScormVersion] = useState<"1.2" | "2004">("1.2");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/zip" && !file.name.endsWith(".zip")) {
        toast.error("Please upload a ZIP file");
        return;
      }
      if (file.size > 500 * 1024 * 1024) {
        toast.error("File size must be less than 500MB");
        return;
      }
      setScormFile(file);
    }
  };

  const handleUpload = async () => {
    if (!scormFile) {
      toast.error("Please select a SCORM package");
      return;
    }

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload SCORM package to storage
      const fileName = `${lessonId}/${Date.now()}_${scormFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("scorm-packages")
        .upload(fileName, scormFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("scorm-packages")
        .getPublicUrl(fileName);

      // Update lesson with SCORM info
      const { error: updateError } = await supabase
        .from("lessons")
        .update({
          scorm_package_url: publicUrl,
          scorm_version: scormVersion,
          is_scorm_content: true
        })
        .eq("id", lessonId);

      if (updateError) throw updateError;

      toast.success("SCORM package uploaded successfully!");
      setScormFile(null);
      onUploadComplete();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload SCORM package");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileArchive className="h-5 w-5" />
          Upload SCORM Package
        </CardTitle>
        <CardDescription>
          Upload a SCORM-compliant ZIP package for this lesson
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="scorm-version">SCORM Version</Label>
          <Select
            value={scormVersion}
            onValueChange={(value) => setScormVersion(value as "1.2" | "2004")}
          >
            <SelectTrigger id="scorm-version">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1.2">SCORM 1.2</SelectItem>
              <SelectItem value="2004">SCORM 2004</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scorm-file">SCORM Package (ZIP)</Label>
          <Input
            id="scorm-file"
            type="file"
            accept=".zip,application/zip"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {scormFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {scormFile.name} ({(scormFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <Button
          onClick={handleUpload}
          disabled={!scormFile || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload SCORM Package
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
