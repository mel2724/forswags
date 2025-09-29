import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface ScormPlayerProps {
  lessonId: string;
  scormPackageUrl: string;
  scormVersion: "1.2" | "2004";
  onComplete?: () => void;
}

export const ScormPlayer = ({ lessonId, scormPackageUrl, scormVersion, onComplete }: ScormPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    loadProgress();
    setupScormAPI();
  }, [lessonId]);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("scorm_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (error) throw error;
      setProgress(data);
    } catch (error: any) {
      console.error("Failed to load SCORM progress:", error);
    }
  };

  const setupScormAPI = () => {
    // Create SCORM API adapter
    const API: any = {
      LMSInitialize: () => {
        console.log("SCORM: LMSInitialize called");
        return "true";
      },
      LMSFinish: () => {
        console.log("SCORM: LMSFinish called");
        saveProgress();
        return "true";
      },
      LMSGetValue: (element: string) => {
        console.log("SCORM: LMSGetValue", element);
        if (element === "cmi.core.lesson_status") {
          return progress?.lesson_status || "not attempted";
        }
        if (element === "cmi.core.lesson_location") {
          return progress?.lesson_location || "";
        }
        if (element === "cmi.suspend_data") {
          return progress?.suspend_data || "";
        }
        return "";
      },
      LMSSetValue: (element: string, value: string) => {
        console.log("SCORM: LMSSetValue", element, value);
        setProgress((prev: any) => {
          const updated = { ...prev };
          
          if (element === "cmi.core.lesson_status") {
            updated.lesson_status = value;
            if (value === "completed" || value === "passed") {
              onComplete?.();
            }
          } else if (element === "cmi.core.lesson_location") {
            updated.lesson_location = value;
          } else if (element === "cmi.suspend_data") {
            updated.suspend_data = value;
          } else if (element === "cmi.core.score.raw") {
            updated.score_raw = parseFloat(value);
          }
          
          return updated;
        });
        return "true";
      },
      LMSCommit: () => {
        console.log("SCORM: LMSCommit called");
        saveProgress();
        return "true";
      },
      LMSGetLastError: () => "0",
      LMSGetErrorString: () => "",
      LMSGetDiagnostic: () => "",
    };

    // Expose API to iframe
    (window as any).API = API;
    (window as any).API_1484_11 = API; // SCORM 2004
  };

  const saveProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("scorm_progress")
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          lesson_status: progress?.lesson_status || "incomplete",
          lesson_location: progress?.lesson_location || "",
          suspend_data: progress?.suspend_data || "",
          score_raw: progress?.score_raw || null,
          completion_status: progress?.completion_status || null,
          success_status: progress?.success_status || null,
        });

      if (error) throw error;
    } catch (error: any) {
      console.error("Failed to save SCORM progress:", error);
      toast.error("Failed to save progress");
    }
  };

  // For SCORM packages, we need to extract and serve the content
  // In a production environment, you'd extract the ZIP server-side
  // and serve the index.html or launch file specified in imsmanifest.xml
  
  return (
    <Card className="overflow-hidden bg-card/80 backdrop-blur border-2 border-primary/20">
      <CardContent className="p-0">
        <div className="aspect-video bg-muted relative">
          <iframe
            ref={iframeRef}
            src={scormPackageUrl}
            className="w-full h-full border-0"
            title="SCORM Content"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
          <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur px-3 py-1 rounded text-xs">
            Status: {progress?.lesson_status || "Not Started"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
