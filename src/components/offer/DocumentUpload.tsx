import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, X } from "lucide-react";

interface Document {
  name: string;
  url: string;
}

interface DocumentUploadProps {
  documents: Document[];
  uploadingDocument: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveDocument: (index: number) => void;
}

export const DocumentUpload = ({
  documents,
  uploadingDocument,
  onFileUpload,
  onRemoveDocument,
}: DocumentUploadProps) => {
  return (
    <div className="space-y-2">
      <Label>Documents</Label>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            type="file"
            onChange={onFileUpload}
            disabled={uploadingDocument}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={uploadingDocument}
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>
        {documents.length > 0 && (
          <div className="space-y-1">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded border bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{doc.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveDocument(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
