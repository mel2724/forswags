import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Award, Download, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface Certificate {
  id: string;
  certificate_url: string | null;
  issued_at: string;
}

interface CourseCertificateProps {
  courseId: string;
  courseName: string;
}

const CourseCertificate = ({ courseId, courseName }: CourseCertificateProps) => {
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadCertificate();
    loadProgress();
  }, [courseId]);

  const loadCertificate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("course_certificates")
        .select("*")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setCertificate(data);
    } catch (error) {
      console.error("Error loading certificate:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("course_progress")
        .select("*")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setProgress(data);
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  };

  const generateCertificate = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if course is completed
      if (!progress || progress.progress_percentage < 100) {
        toast.error("Complete all lessons to earn a certificate");
        return;
      }

      // Create certificate record
      const { error } = await supabase
        .from("course_certificates")
        .insert({
          user_id: user.id,
          course_id: courseId,
        });

      if (error) throw error;

      toast.success("Certificate generated successfully!");
      loadCertificate();
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.error("Failed to generate certificate");
    } finally {
      setGenerating(false);
    }
  };

  const downloadCertificate = () => {
    // In a real application, this would generate and download a PDF
    toast.info("Certificate download will be implemented soon");
  };

  if (loading) {
    return null;
  }

  const isEligible = progress?.progress_percentage === 100;

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Course Certificate
        </CardTitle>
        <CardDescription>
          {certificate
            ? "You've earned this certificate!"
            : isEligible
            ? "Generate your completion certificate"
            : "Complete all lessons to earn a certificate"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {certificate ? (
          <div className="space-y-4">
            <div className="p-6 rounded-lg bg-card border-2 border-primary/30 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Certificate of Completion</h3>
              <p className="text-muted-foreground mb-1">{courseName}</p>
              <Badge variant="outline" className="mb-4">
                Issued {format(new Date(certificate.issued_at), "MMM d, yyyy")}
              </Badge>
            </div>

            <Button onClick={downloadCertificate} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Certificate
            </Button>
          </div>
        ) : isEligible ? (
          <div className="space-y-4">
            <div className="p-6 rounded-lg bg-muted/50 text-center">
              <Award className="h-12 w-12 text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Congratulations! You've completed all lessons in this course.
              </p>
            </div>
            <Button
              onClick={generateCertificate}
              disabled={generating}
              className="w-full"
            >
              {generating ? "Generating..." : "Generate Certificate"}
            </Button>
          </div>
        ) : (
          <div className="p-6 rounded-lg bg-muted/50 text-center">
            <Award className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Complete {100 - (progress?.progress_percentage || 0)}% more of the
              course to earn your certificate
            </p>
            <div className="w-full bg-muted rounded-full h-2 mt-4">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress?.progress_percentage || 0}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseCertificate;
