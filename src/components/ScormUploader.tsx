import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileArchive } from "lucide-react";

interface ScormUploaderProps {
  lessonId: string;
  onUploadComplete: () => void;
}

export const ScormUploader = ({ lessonId, onUploadComplete }: ScormUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [scormFile, setScormFile] = useState<File | null>(null);
  const [scormVersion, setScormVersion] = useState<"1.2" | "2004">("1.2");

  const handleUpload = async () => {
    if (!scormFile) {
      toast.error("Please select a SCORM package");
      return;
    }

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData?.role !== "admin") {
        throw new Error("Only admins can upload SCORM packages");
      }

      // Upload SCORM package
      const fileName = `${lessonId}/${Date.now()}_${scormFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("scorm-packages")
        .upload(fileName, scormFile);

      if (uploadError) throw uploadError;

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
          Upload a SCORM 1.2 or SCORM 2004 compliant package (.zip file)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="scorm-version">SCORM Version</Label>
          <Select
            value={scormVersion}
            onValueChange={(v) => setScormVersion(v as "1.2" | "2004")}
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

        <div>
          <Label htmlFor="scorm-file">SCORM Package (ZIP)</Label>
          <Input
            id="scorm-file"
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            onChange={(e) => setScormFile(e.target.files?.[0] || null)}
          />
          {scormFile && (
            <p className="text-sm text-muted-foreground mt-2">
              Selected: {scormFile.name} ({(scormFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <Button
          onClick={handleUpload}
          disabled={uploading || !scormFile}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading..." : "Upload SCORM Package"}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Maximum file size: 500MB</p>
          <p>• Supported formats: ZIP archives containing SCORM content</p>
          <p>• The package must include a valid imsmanifest.xml file</p>
        </div>
      </CardContent>
    </Card>
  );
};
