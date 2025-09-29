import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ScormPlayerProps {
  lessonId: string;
  scormPackageUrl: string;
  scormVersion: "1.2" | "2004";
  onComplete?: () => void;
}

export const ScormPlayer = ({ lessonId, scormPackageUrl, scormVersion, onComplete }: ScormPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
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

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setScormData(data);
      }
    } catch (error: any) {
      console.error("Failed to load SCORM progress:", error);
    }
  };

  const setupScormAPI = () => {
    // Create SCORM API object
    const API: any = {
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
            return scormData.score_raw || "";
          case "cmi.core.score.min":
            return scormData.score_min || "0";
          case "cmi.core.score.max":
            return scormData.score_max || "100";
          default:
            return "";
        }
      },
      LMSSetValue: (element: string, value: string) => {
        console.log("SCORM: LMSSetValue", element, value);
        setScormData((prev: any) => ({
          ...prev,
          [element.replace("cmi.core.", "").replace("cmi.", "").replace(".", "_")]: value
        }));
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

    // Expose API to iframe
    (window as any).API = API;
    (window as any).API_1484_11 = API; // SCORM 2004

    console.log("SCORM API initialized");
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
          lesson_status: scormData.lesson_status || "incomplete",
          lesson_location: scormData.lesson_location || "",
          suspend_data: scormData.suspend_data || "",
          score_raw: scormData.score_raw ? parseFloat(scormData.score_raw) : null,
          score_min: scormData.score_min ? parseFloat(scormData.score_min) : null,
          score_max: scormData.score_max ? parseFloat(scormData.score_max) : null,
          session_time: scormData.session_time || "",
          total_time: scormData.total_time || "",
          completion_status: scormData.completion_status || "",
          success_status: scormData.success_status || "",
        });

      if (error) throw error;

      if (scormData.lesson_status === "completed" || scormData.completion_status === "completed") {
        toast.success("Lesson completed!");
        onComplete?.();
      }
    } catch (error: any) {
      console.error("Failed to save SCORM progress:", error);
    }
  };

  const handleIframeLoad = () => {
    setLoading(false);
    // Inject SCORM API reference into iframe
    if (iframeRef.current?.contentWindow) {
      (iframeRef.current.contentWindow as any).API = (window as any).API;
      (iframeRef.current.contentWindow as any).API_1484_11 = (window as any).API_1484_11;
    }
  };

  return (
    <Card className="relative overflow-hidden bg-card/80 backdrop-blur border-2 border-primary/20">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading SCORM content...</p>
          </div>
        </div>
      )}
      <div className="aspect-video bg-muted">
        <iframe
          ref={iframeRef}
          src={`${scormPackageUrl}/index.html`}
          className="w-full h-full"
          onLoad={handleIframeLoad}
          title="SCORM Content"
        />
      </div>
      <div className="p-4 bg-muted/50 text-xs text-muted-foreground">
        <p>SCORM {scormVersion} Content</p>
        {scormData.lesson_status && (
          <p className="mt-1">Status: {scormData.lesson_status}</p>
        )}
      </div>
    </Card>
  );
};
