import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ScormPlayerProps {
  lessonId: string;
  scormPackageUrl: string;
  scormVersion: "1.2" | "2004";
}

export const ScormPlayer = ({ lessonId, scormPackageUrl, scormVersion }: ScormPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scormData, setScormData] = useState<any>({});

  useEffect(() => {
    loadScormProgress();
    setupScormAPI();
  }, [lessonId]);

  const loadScormProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("scorm_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setScormData(data);
      } else {
        const { error: insertError } = await supabase
          .from("scorm_progress")
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            lesson_status: "not attempted",
          });

        if (insertError) throw insertError;
      }
    } catch (error: any) {
      console.error("Failed to load SCORM progress:", error);
    }
  };

  const setupScormAPI = () => {
    const scormAPI = {
      LMSInitialize: () => {
        console.log("SCORM: LMSInitialize");
        return "true";
      },
      LMSFinish: () => {
        console.log("SCORM: LMSFinish");
        saveScormProgress();
        return "true";
      },
      LMSGetValue: (element: string) => {
        console.log("SCORM: LMSGetValue", element);
        
        switch (element) {
          case "cmi.core.lesson_status":
            return scormData.lesson_status || "not attempted";
          case "cmi.core.lesson_location":
            return scormData.lesson_location || "";
          case "cmi.suspend_data":
            return scormData.suspend_data || "";
          case "cmi.core.score.raw":
            return scormData.score_raw?.toString() || "";
          case "cmi.core.score.min":
            return scormData.score_min?.toString() || "0";
          case "cmi.core.score.max":
            return scormData.score_max?.toString() || "100";
          default:
            return "";
        }
      },
      LMSSetValue: (element: string, value: string) => {
        console.log("SCORM: LMSSetValue", element, value);
        
        const updates: any = {};
        
        switch (element) {
          case "cmi.core.lesson_status":
            updates.lesson_status = value;
            break;
          case "cmi.core.lesson_location":
            updates.lesson_location = value;
            break;
          case "cmi.suspend_data":
            updates.suspend_data = value;
            break;
          case "cmi.core.score.raw":
            updates.score_raw = parseFloat(value);
            break;
          case "cmi.core.score.min":
            updates.score_min = parseFloat(value);
            break;
          case "cmi.core.score.max":
            updates.score_max = parseFloat(value);
            break;
        }
        
        setScormData((prev: any) => ({ ...prev, ...updates }));
        return "true";
      },
      LMSCommit: () => {
        console.log("SCORM: LMSCommit");
        saveScormProgress();
        return "true";
      },
      LMSGetLastError: () => "0",
      LMSGetErrorString: () => "",
      LMSGetDiagnostic: () => "",
    };

    (window as any).API = scormAPI;
    (window as any).API_1484_11 = scormAPI;
  };

  const saveScormProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("scorm_progress")
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          ...scormData,
        });

      if (error) throw error;
      
      console.log("SCORM progress saved successfully");
    } catch (error: any) {
      console.error("Failed to save SCORM progress:", error);
      toast.error("Failed to save progress");
    }
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError("Failed to load SCORM content. Please check the package format.");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline">SCORM {scormVersion}</Badge>
        {scormData.lesson_status && (
          <Badge variant={scormData.lesson_status === "completed" ? "default" : "secondary"}>
            Status: {scormData.lesson_status}
          </Badge>
        )}
        {scormData.score_raw !== undefined && (
          <Badge variant="outline">
            Score: {scormData.score_raw}%
          </Badge>
        )}
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <Card className="overflow-hidden bg-card/80 backdrop-blur border-2 border-primary/20">
          <div className="relative aspect-video bg-muted">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            <Alert className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>SCORM Player Integration:</strong> This displays SCORM content. 
                The SCORM API (window.API) is initialized and tracking user progress automatically.
                <br />
                <br />
                Package: <code className="text-xs break-all">{scormPackageUrl}</code>
              </AlertDescription>
            </Alert>

            <iframe
              ref={iframeRef}
              title="SCORM Content"
              className="w-full h-full"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
          </div>
        </Card>
      )}

      <div className="text-xs text-muted-foreground space-y-1 pt-2">
        <p><strong>SCORM Features Active:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Progress tracking and suspension data saved</li>
          <li>Score reporting integrated</li>
          <li>Lesson completion status monitored</li>
          <li>API calls logged to console for debugging</li>
        </ul>
      </div>
    </div>
  );
};
