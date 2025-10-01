import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, Text, FabricImage, Textbox, Shadow } from "fabric";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Sparkles, Image as ImageIcon } from "lucide-react";
import logoFull from "@/assets/logo-full.jpeg";

interface GraphicTemplate {
  type: "offer" | "commitment" | "achievement" | "match" | "custom";
  title: string;
  description: string;
}

const TEMPLATES: GraphicTemplate[] = [
  { type: "offer", title: "College Offer", description: "Announce a new scholarship offer" },
  { type: "commitment", title: "Commitment", description: "Celebrate your college commitment" },
  { type: "achievement", title: "Achievement", description: "Share an accomplishment or award" },
  { type: "match", title: "College Match", description: "Highlight your top college matches" },
  { type: "custom", title: "Custom", description: "Create your own announcement" },
];

interface SocialMediaGraphicGeneratorProps {
  athleteName?: string;
  athleteSport?: string;
}

export const SocialMediaGraphicGenerator = ({ athleteName = "", athleteSport = "" }: SocialMediaGraphicGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<GraphicTemplate>(TEMPLATES[0]);
  const [mainText, setMainText] = useState("");
  const [subText, setSubText] = useState("");
  const [detailText, setDetailText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1080,
      height: 1080,
      backgroundColor: "#1a1a1a",
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  const generateGraphic = async () => {
    if (!fabricCanvas) return;
    setLoading(true);

    try {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "#1a1a1a";

      // Add gradient background
      const gradient = new Rect({
        left: 0,
        top: 0,
        width: 1080,
        height: 1080,
        fill: createGradient(),
        selectable: false,
      });
      fabricCanvas.add(gradient);

      // Add decorative elements based on template
      if (selectedTemplate.type === "offer") {
        await addOfferGraphic();
      } else if (selectedTemplate.type === "commitment") {
        await addCommitmentGraphic();
      } else if (selectedTemplate.type === "achievement") {
        await addAchievementGraphic();
      } else if (selectedTemplate.type === "match") {
        await addMatchGraphic();
      } else {
        await addCustomGraphic();
      }

      // Add ForSWAGs branding
      await addBranding();

      fabricCanvas.renderAll();
      toast.success("Graphic generated! You can now download it.");
    } catch (error) {
      console.error("Error generating graphic:", error);
      toast.error("Failed to generate graphic");
    } finally {
      setLoading(false);
    }
  };

  const createGradient = () => {
    if (!fabricCanvas) return "#1a1a1a";
    
    const gradientColors = {
      offer: ["#9B51E0", "#6366F1"],
      commitment: "#FFD623",
      achievement: ["#10b981", "#3b82f6"],
      match: ["#f59e0b", "#ef4444"],
      custom: ["#8b5cf6", "#ec4899"],
    };

    const colors = selectedTemplate.type === "commitment" 
      ? [gradientColors.commitment, gradientColors.commitment]
      : gradientColors[selectedTemplate.type] || gradientColors.custom;

    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
  };

  const addOfferGraphic = async () => {
    if (!fabricCanvas) return;

    // Main headline
    const headline = new Textbox(mainText || "BLESSED TO RECEIVE AN OFFER", {
      left: 540,
      top: 200,
      width: 900,
      fontSize: 72,
      fontWeight: "900",
      fill: "#ffffff",
      textAlign: "center",
      originX: "center",
      fontFamily: "Arial Black, sans-serif",
      shadow: new Shadow({ color: "rgba(0,0,0,0.5)", blur: 20, offsetX: 0, offsetY: 4 }),
    });
    fabricCanvas.add(headline);

    // School name
    if (subText) {
      const schoolName = new Textbox(subText, {
        left: 540,
        top: 420,
        width: 900,
        fontSize: 96,
        fontWeight: "900",
        fill: "#FFD623",
        textAlign: "center",
        originX: "center",
        fontFamily: "Arial Black, sans-serif",
        shadow: new Shadow({ color: "rgba(0,0,0,0.8)", blur: 20, offsetX: 0, offsetY: 4 }),
      });
      fabricCanvas.add(schoolName);
    }

    // Details (scholarship type, etc.)
    if (detailText) {
      const details = new Textbox(detailText, {
        left: 540,
        top: 650,
        width: 800,
        fontSize: 42,
        fill: "#ffffff",
        textAlign: "center",
        originX: "center",
        fontFamily: "Arial, sans-serif",
      });
      fabricCanvas.add(details);
    }

    // Athlete info
    const athleteInfo = new Textbox(`${athleteName}${athleteSport ? ` | ${athleteSport}` : ""}`, {
      left: 540,
      top: 800,
      width: 800,
      fontSize: 36,
      fill: "#ffffff",
      textAlign: "center",
      originX: "center",
      fontFamily: "Arial, sans-serif",
      fontStyle: "italic",
    });
    fabricCanvas.add(athleteInfo);
  };

  const addCommitmentGraphic = async () => {
    if (!fabricCanvas) return;

    // COMMITTED banner
    const banner = new Rect({
      left: 0,
      top: 350,
      width: 1080,
      height: 150,
      fill: "#1a1a1a",
      opacity: 0.9,
    });
    fabricCanvas.add(banner);

    const committed = new Textbox("COMMITTED", {
      left: 540,
      top: 390,
      width: 900,
      fontSize: 84,
      fontWeight: "900",
      fill: "#FFD623",
      textAlign: "center",
      originX: "center",
      fontFamily: "Arial Black, sans-serif",
      shadow: new Shadow({ color: "rgba(0,0,0,0.8)", blur: 20, offsetX: 0, offsetY: 4 }),
    });
    fabricCanvas.add(committed);

    // School name
    if (subText) {
      const schoolName = new Textbox(subText, {
        left: 540,
        top: 550,
        width: 900,
        fontSize: 96,
        fontWeight: "900",
        fill: "#ffffff",
        textAlign: "center",
        originX: "center",
        fontFamily: "Arial Black, sans-serif",
        shadow: new Shadow({ color: "rgba(0,0,0,0.5)", blur: 20, offsetX: 0, offsetY: 4 }),
      });
      fabricCanvas.add(schoolName);
    }

    // Athlete info
    const athleteInfo = new Textbox(`${athleteName}${athleteSport ? ` | ${athleteSport}` : ""}`, {
      left: 540,
      top: 750,
      width: 800,
      fontSize: 42,
      fill: "#ffffff",
      textAlign: "center",
      originX: "center",
      fontFamily: "Arial, sans-serif",
    });
    fabricCanvas.add(athleteInfo);

    // Additional message
    if (detailText) {
      const message = new Textbox(detailText, {
        left: 540,
        top: 850,
        width: 800,
        fontSize: 32,
        fill: "#ffffff",
        textAlign: "center",
        originX: "center",
        fontFamily: "Arial, sans-serif",
        fontStyle: "italic",
      });
      fabricCanvas.add(message);
    }
  };

  const addAchievementGraphic = async () => {
    if (!fabricCanvas) return;

    // Achievement title
    const title = new Textbox(mainText || "NEW ACHIEVEMENT", {
      left: 540,
      top: 250,
      width: 900,
      fontSize: 68,
      fontWeight: "900",
      fill: "#ffffff",
      textAlign: "center",
      originX: "center",
      fontFamily: "Arial Black, sans-serif",
      shadow: new Shadow({ color: "rgba(0,0,0,0.5)", blur: 20, offsetX: 0, offsetY: 4 }),
    });
    fabricCanvas.add(title);

    // Achievement details
    if (subText) {
      const details = new Textbox(subText, {
        left: 540,
        top: 450,
        width: 800,
        fontSize: 52,
        fontWeight: "700",
        fill: "#FFD623",
        textAlign: "center",
        originX: "center",
        fontFamily: "Arial, sans-serif",
      });
      fabricCanvas.add(details);
    }

    // Additional context
    if (detailText) {
      const context = new Textbox(detailText, {
        left: 540,
        top: 600,
        width: 800,
        fontSize: 36,
        fill: "#ffffff",
        textAlign: "center",
        originX: "center",
        fontFamily: "Arial, sans-serif",
      });
      fabricCanvas.add(context);
    }

    // Athlete info
    const athleteInfo = new Textbox(`${athleteName}${athleteSport ? ` | ${athleteSport}` : ""}`, {
      left: 540,
      top: 800,
      width: 800,
      fontSize: 36,
      fill: "#ffffff",
      textAlign: "center",
      originX: "center",
      fontFamily: "Arial, sans-serif",
      fontStyle: "italic",
    });
    fabricCanvas.add(athleteInfo);
  };

  const addMatchGraphic = async () => {
    if (!fabricCanvas) return;

    const title = new Textbox("TOP COLLEGE MATCHES", {
      left: 540,
      top: 200,
      width: 900,
      fontSize: 64,
      fontWeight: "900",
      fill: "#ffffff",
      textAlign: "center",
      originX: "center",
      fontFamily: "Arial Black, sans-serif",
      shadow: new Shadow({ color: "rgba(0,0,0,0.5)", blur: 20, offsetX: 0, offsetY: 4 }),
    });
    fabricCanvas.add(title);

    // Match details
    if (mainText) {
      const matches = new Textbox(mainText, {
        left: 540,
        top: 400,
        width: 800,
        fontSize: 42,
        fill: "#ffffff",
        textAlign: "center",
        originX: "center",
        fontFamily: "Arial, sans-serif",
        lineHeight: 1.5,
      });
      fabricCanvas.add(matches);
    }

    // Athlete info
    const athleteInfo = new Textbox(`${athleteName}${athleteSport ? ` | ${athleteSport}` : ""}`, {
      left: 540,
      top: 800,
      width: 800,
      fontSize: 36,
      fill: "#ffffff",
      textAlign: "center",
      originX: "center",
      fontFamily: "Arial, sans-serif",
      fontStyle: "italic",
    });
    fabricCanvas.add(athleteInfo);
  };

  const addCustomGraphic = async () => {
    if (!fabricCanvas) return;

    if (mainText) {
      const text = new Textbox(mainText, {
        left: 540,
        top: 300,
        width: 900,
        fontSize: 64,
        fontWeight: "900",
        fill: "#ffffff",
        textAlign: "center",
        originX: "center",
        fontFamily: "Arial Black, sans-serif",
        shadow: new Shadow({ color: "rgba(0,0,0,0.5)", blur: 20, offsetX: 0, offsetY: 4 }),
      });
      fabricCanvas.add(text);
    }

    if (subText) {
      const sub = new Textbox(subText, {
        left: 540,
        top: 500,
        width: 800,
        fontSize: 42,
        fill: "#FFD623",
        textAlign: "center",
        originX: "center",
        fontFamily: "Arial, sans-serif",
      });
      fabricCanvas.add(sub);
    }

    if (detailText) {
      const detail = new Textbox(detailText, {
        left: 540,
        top: 650,
        width: 800,
        fontSize: 32,
        fill: "#ffffff",
        textAlign: "center",
        originX: "center",
        fontFamily: "Arial, sans-serif",
      });
      fabricCanvas.add(detail);
    }
  };

  const addBranding = async () => {
    if (!fabricCanvas) return;

    // ForSWAGs watermark
    const watermark = new Textbox("ForSWAGs.com", {
      left: 540,
      top: 950,
      width: 400,
      fontSize: 32,
      fontWeight: "700",
      fill: "#ffffff",
      textAlign: "center",
      originX: "center",
      fontFamily: "Arial, sans-serif",
      opacity: 0.9,
    });
    fabricCanvas.add(watermark);

    // Tagline
    const tagline = new Text("Building Champions On & Off The Field", {
      left: 540,
      top: 1000,
      fontSize: 20,
      fill: "#ffffff",
      textAlign: "center",
      originX: "center",
      fontFamily: "Arial, sans-serif",
      opacity: 0.7,
    });
    fabricCanvas.add(tagline);
  };

  const downloadGraphic = () => {
    if (!fabricCanvas) return;

    const dataURL = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    });

    const link = document.createElement("a");
    link.download = `forswags-${selectedTemplate.type}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    toast.success("Graphic downloaded successfully!");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Social Media Graphic Generator
        </CardTitle>
        <CardDescription>
          Create professional graphics to announce your achievements and build your brand
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Template Type</Label>
            <Select
              value={selectedTemplate.type}
              onValueChange={(value) => {
                const template = TEMPLATES.find(t => t.type === value);
                if (template) setSelectedTemplate(template);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((template) => (
                  <SelectItem key={template.type} value={template.type}>
                    {template.title} - {template.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Main Text</Label>
            <Input
              placeholder={
                selectedTemplate.type === "offer" ? "e.g., BLESSED TO RECEIVE AN OFFER" :
                selectedTemplate.type === "commitment" ? "Your commitment message" :
                selectedTemplate.type === "achievement" ? "Achievement title" :
                selectedTemplate.type === "match" ? "List your top matches" :
                "Your main headline"
              }
              value={mainText}
              onChange={(e) => setMainText(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Sub Text</Label>
            <Input
              placeholder={
                selectedTemplate.type === "offer" || selectedTemplate.type === "commitment"
                  ? "School name"
                  : "Supporting text"
              }
              value={subText}
              onChange={(e) => setSubText(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Details</Label>
            <Textarea
              placeholder={
                selectedTemplate.type === "offer"
                  ? "e.g., Full Scholarship | Division 1"
                  : "Additional details or message"
              }
              value={detailText}
              onChange={(e) => setDetailText(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={generateGraphic} disabled={loading} className="flex-1">
              <ImageIcon className="mr-2 h-4 w-4" />
              {loading ? "Generating..." : "Generate Graphic"}
            </Button>
            <Button
              onClick={downloadGraphic}
              variant="outline"
              disabled={!fabricCanvas || loading}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden bg-muted">
          <canvas ref={canvasRef} className="w-full h-auto" />
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Graphics are optimized for Instagram (1080x1080)</p>
          <p>• ForSWAGs branding is automatically included</p>
          <p>• Download and share on all your social platforms</p>
        </div>
      </CardContent>
    </Card>
  );
};
