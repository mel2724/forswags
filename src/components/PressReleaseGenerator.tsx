import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Loader2, Printer, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useNavigate } from "react-router-dom";

const MILESTONE_TYPES = [
  { value: "commitment", label: "College Commitment" },
  { value: "scholarship", label: "Scholarship Award" },
  { value: "championship", label: "Championship Win" },
  { value: "record", label: "Record Breaking Performance" },
  { value: "award", label: "Award/Honor Received" },
  { value: "signing", label: "Letter of Intent Signing" },
  { value: "allstar", label: "All-Star Selection" },
  { value: "other", label: "Other Milestone" },
];

export function PressReleaseGenerator() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [milestoneType, setMilestoneType] = useState("");
  const [athleteName, setAthleteName] = useState("");
  const [sport, setSport] = useState("");
  const [details, setDetails] = useState("");
  const [quote, setQuote] = useState("");
  const [generatedRelease, setGeneratedRelease] = useState("");
  const { hasAccess, isLoading } = useFeatureAccess("press_release_generator");

  const generatePressRelease = async () => {
    if (!hasAccess) {
      toast.error("This feature requires a paid membership");
      return;
    }

    if (!milestoneType || !athleteName || !sport || !details) {
      toast.error("Please fill in all required fields");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-press-release", {
        body: {
          milestoneType,
          athleteName,
          sport,
          details,
          quote: quote || undefined,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setGeneratedRelease(data.pressRelease);
      toast.success("Press release generated successfully!");
    } catch (error) {
      console.error("Error generating press release:", error);
      toast.error("Failed to generate press release. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!generatedRelease) {
      toast.error("Please generate a press release first");
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);

      // Add logo/header
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.text("FOR IMMEDIATE RELEASE", margin, margin);

      // Add date
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      const today = new Date().toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      });
      doc.text(today, margin, margin + 10);

      // Add press release content
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(generatedRelease, maxWidth);
      let yPosition = margin + 25;

      lines.forEach((line: string) => {
        if (yPosition > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 7;
      });

      // Add footer
      const footerY = doc.internal.pageSize.getHeight() - 20;
      doc.setFontSize(9);
      doc.setFont(undefined, "italic");
      doc.text("###", pageWidth / 2, footerY, { align: "center" });
      doc.text("Generated via ForSWAGs - www.forswags.com", pageWidth / 2, footerY + 5, { align: "center" });

      // Save the PDF
      const fileName = `press-release-${athleteName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.pdf`;
      doc.save(fileName);
      toast.success("Press release downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const printRelease = () => {
    if (!generatedRelease) {
      toast.error("Please generate a press release first");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print");
      return;
    }

    const today = new Date().toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Press Release - ${athleteName}</title>
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              max-width: 8.5in;
              margin: 1in auto;
              padding: 0;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 10px;
            }
            .date {
              text-align: center;
              font-size: 12px;
              margin-bottom: 20px;
            }
            .content {
              font-size: 12px;
              text-align: justify;
              white-space: pre-wrap;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              font-style: italic;
              font-size: 11px;
            }
            @media print {
              body { margin: 0.5in; }
            }
          </style>
        </head>
        <body>
          <div class="header">FOR IMMEDIATE RELEASE</div>
          <div class="date">${today}</div>
          <div class="content">${generatedRelease}</div>
          <div class="footer">
            ###<br>
            Generated via ForSWAGs - www.forswags.com
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <Card className="border-primary/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Premium Feature</CardTitle>
              <CardDescription>Press Release Generator requires a paid membership</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create professional press releases for major athletic achievements and milestones with AI-powered writing assistance.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>Unlimited press release generations</span>
            </li>
            <li className="flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" />
              <span>PDF download and printing</span>
            </li>
            <li className="flex items-center gap-2">
              <Printer className="h-4 w-4 text-primary" />
              <span>Professional formatting</span>
            </li>
          </ul>
          <Button onClick={() => navigate("/membership")} className="w-full" size="lg">
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Access
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Professional Press Release Generator
          </CardTitle>
          <CardDescription>
            Create a professional press release for major athletic achievements and milestones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="milestone-type">
                Milestone Type <span className="text-destructive">*</span>
              </Label>
              <Select value={milestoneType} onValueChange={setMilestoneType}>
                <SelectTrigger id="milestone-type">
                  <SelectValue placeholder="Select milestone type" />
                </SelectTrigger>
                <SelectContent>
                  {MILESTONE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="athlete-name">
                Athlete Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="athlete-name"
                placeholder="John Smith"
                value={athleteName}
                onChange={(e) => setAthleteName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sport">
                Sport <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sport"
                placeholder="Basketball"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">
              Milestone Details <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="details"
              placeholder="Provide key details about the achievement (e.g., school name, statistics, dates, competition level, etc.)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Include important facts, statistics, dates, and any relevant background information
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote">Personal Quote (Optional)</Label>
            <Textarea
              id="quote"
              placeholder='Add a personal quote (e.g., "This has been a dream come true...")'
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              A quote from you adds personality and authenticity to the press release
            </p>
          </div>

          <Button
            onClick={generatePressRelease}
            disabled={generating}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Press Release...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Press Release
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedRelease && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Press Release</CardTitle>
            <CardDescription>Review and download your professional press release</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-6 bg-muted/50">
              <div className="text-center font-bold mb-2">FOR IMMEDIATE RELEASE</div>
              <div className="text-center text-sm text-muted-foreground mb-4">
                {new Date().toLocaleDateString("en-US", { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {generatedRelease}
              </div>
              <div className="text-center text-sm text-muted-foreground mt-6 italic">
                ###
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={downloadPDF} className="flex-1" variant="default">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={printRelease} className="flex-1" variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              💡 Pro tip: Share your press release with local media, school newspapers, and on social media
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
