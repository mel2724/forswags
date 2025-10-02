import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, Text, FabricImage, Textbox, Shadow, Gradient } from "fabric";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Sparkles, Image as ImageIcon, Crown } from "lucide-react";
import logoFull from "@/assets/logo-full.jpeg";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<GraphicTemplate>(TEMPLATES[0]);
  const [mainText, setMainText] = useState("");
  const [subText, setSubText] = useState("");
  const [detailText, setDetailText] = useState("");
  const [loading, setLoading] = useState(false);
  const { hasAccess, isLoading } = useFeatureAccess("social_media_graphics");

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
      fabricCanvas.backgroundColor = "#0a0a0a";

      // Add gradient background
      const gradientColors = {
        offer: ["#4C1D95", "#7C3AED", "#A855F7"],
        commitment: ["#92400E", "#CA8A04", "#EAB308"],
        achievement: ["#065F46", "#059669", "#10B981"],
        match: ["#9F1239", "#DC2626", "#F87171"],
        custom: ["#581C87", "#7C3AED", "#C084FC"],
      };

      const colors = gradientColors[selectedTemplate.type] || gradientColors.custom;
      
      const gradient = new Gradient({
        type: 'linear',
        gradientUnits: 'pixels',
        coords: { x1: 0, y1: 0, x2: 0, y2: 1080 },
        colorStops: [
          { offset: 0, color: colors[0] },
          { offset: 0.5, color: colors[1] },
          { offset: 1, color: colors[2] }
        ]
      });

      const bgRect = new Rect({
        left: 0,
        top: 0,
        width: 1080,
        height: 1080,
        fill: gradient,
        selectable: false,
      });
      fabricCanvas.add(bgRect);

      // Add ForSWAGs logo as watermark
      await addLogoWatermark();

      // Add decorative overlay pattern
      await addDecorativeOverlay();

      // Add template-specific content
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

      // Add ForSWAGs branding footer
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

  const addLogoWatermark = async () => {
    if (!fabricCanvas) return;

    return new Promise<void>((resolve) => {
      FabricImage.fromURL(logoFull).then((img) => {
        img.set({
          left: 540,
          top: 540,
          originX: 'center',
          originY: 'center',
          opacity: 0.08,
          selectable: false,
        });
        
        // Scale to fit nicely
        const scale = Math.min(800 / (img.width || 1), 800 / (img.height || 1));
        img.scale(scale);
        
        fabricCanvas.add(img);
        fabricCanvas.sendObjectToBack(img);
        resolve();
      }).catch(() => resolve());
    });
  };

  const addDecorativeOverlay = async () => {
    if (!fabricCanvas) return;

    // Add subtle diagonal stripes for texture
    for (let i = 0; i < 15; i++) {
      const stripe = new Rect({
        left: -200 + (i * 150),
        top: -100,
        width: 80,
        height: 1300,
        fill: "#ffffff",
        opacity: 0.02,
        angle: 25,
        selectable: false,
      });
      fabricCanvas.add(stripe);
    }

    // Add corner accent elements
    const cornerAccent1 = new Rect({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
      fill: "#ffffff",
      opacity: 0.05,
      selectable: false,
    });
    fabricCanvas.add(cornerAccent1);

    const cornerAccent2 = new Rect({
      left: 880,
      top: 880,
      width: 200,
      height: 200,
      fill: "#ffffff",
      opacity: 0.05,
      selectable: false,
    });
    fabricCanvas.add(cornerAccent2);
  };

  const addOfferGraphic = async () => {
    if (!fabricCanvas) return;

    // Add dark banner for main text
    const topBanner = new Rect({
      left: 0,
      top: 180,
      width: 1080,
      height: 180,
      fill: "#000000",
      opacity: 0.75,
      selectable: false,
    });
    fabricCanvas.add(topBanner);

    // Main headline with glow effect
    const headline = new Textbox(mainText || "BLESSED TO RECEIVE AN OFFER", {
      left: 540,
      top: 220,
      width: 950,
      fontSize: 70,
      fontWeight: "900",
      fill: "#ffffff",
      textAlign: "center",
      originX: "center",
      fontFamily: "Impact, Arial Black, sans-serif",
      shadow: new Shadow({ 
        color: "rgba(255,214,35,0.8)", 
        blur: 30, 
        offsetX: 0, 
        offsetY: 0 
      }),
      stroke: "#FFD623",
      strokeWidth: 2,
    });
    fabricCanvas.add(headline);

    // School name with dramatic styling
    if (subText) {
      // Background for school name
      const schoolBanner = new Rect({
        left: 0,
        top: 420,
        width: 1080,
        height: 240,
        fill: "#000000",
        opacity: 0.85,
        selectable: false,
      });
      fabricCanvas.add(schoolBanner);

      const schoolName = new Textbox(subText.toUpperCase(), {
        left: 540,
        top: 480,
        width: 950,
        fontSize: 110,
        fontWeight: "900",
        fill: "#FFD623",
        textAlign: "center",
        originX: "center",
        fontFamily: "Impact, Arial Black, sans-serif",
        shadow: new Shadow({ 
          color: "rgba(0,0,0,0.9)", 
          blur: 25, 
          offsetX: 0, 
          offsetY: 8 
        }),
        stroke: "#ffffff",
        strokeWidth: 3,
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

    // Large COMMITTED banner with dramatic styling
    const banner = new Rect({
      left: 0,
      top: 320,
      width: 1080,
      height: 200,
      fill: "#000000",
      opacity: 0.9,
      selectable: false,
    });
    fabricCanvas.add(banner);

    const committed = new Textbox("COMMITTED", {
      left: 540,
      top: 370,
      width: 950,
      fontSize: 100,
      fontWeight: "900",
      fill: "#FFD623",
      textAlign: "center",
      originX: "center",
      fontFamily: "Impact, Arial Black, sans-serif",
      shadow: new Shadow({ 
        color: "rgba(255,214,35,0.8)", 
        blur: 35, 
        offsetX: 0, 
        offsetY: 0 
      }),
      stroke: "#ffffff",
      strokeWidth: 4,
    });
    fabricCanvas.add(committed);

    // School name with massive emphasis
    if (subText) {
      const schoolBanner = new Rect({
        left: 0,
        top: 550,
        width: 1080,
        height: 220,
        fill: "#000000",
        opacity: 0.85,
        selectable: false,
      });
      fabricCanvas.add(schoolBanner);

      const schoolName = new Textbox(subText.toUpperCase(), {
        left: 540,
        top: 600,
        width: 950,
        fontSize: 120,
        fontWeight: "900",
        fill: "#ffffff",
        textAlign: "center",
        originX: "center",
        fontFamily: "Impact, Arial Black, sans-serif",
        shadow: new Shadow({ 
          color: "rgba(255,214,35,0.6)", 
          blur: 30, 
          offsetX: 0, 
          offsetY: 6 
        }),
        stroke: "#FFD623",
        strokeWidth: 3,
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

    // Achievement banner
    const titleBanner = new Rect({
      left: 0,
      top: 220,
      width: 1080,
      height: 170,
      fill: "#000000",
      opacity: 0.8,
      selectable: false,
    });
    fabricCanvas.add(titleBanner);

    // Achievement title
    const title = new Textbox(mainText || "NEW ACHIEVEMENT", {
      left: 540,
      top: 260,
      width: 950,
      fontSize: 75,
      fontWeight: "900",
      fill: "#ffffff",
      textAlign: "center",
      originX: "center",
      fontFamily: "Impact, Arial Black, sans-serif",
      shadow: new Shadow({ 
        color: "rgba(16,185,129,0.7)", 
        blur: 30, 
        offsetX: 0, 
        offsetY: 0 
      }),
      stroke: "#10B981",
      strokeWidth: 2,
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

    // Bottom branding bar
    const brandBar = new Rect({
      left: 0,
      top: 920,
      width: 1080,
      height: 160,
      fill: "#000000",
      opacity: 0.85,
      selectable: false,
    });
    fabricCanvas.add(brandBar);

    // ForSWAGs branding with gold accent
    const watermark = new Textbox("ForSWAGs.com", {
      left: 540,
      top: 945,
      width: 500,
      fontSize: 42,
      fontWeight: "900",
      fill: "#FFD623",
      textAlign: "center",
      originX: "center",
      fontFamily: "Impact, Arial Black, sans-serif",
      shadow: new Shadow({ 
        color: "rgba(0,0,0,0.8)", 
        blur: 15, 
        offsetX: 0, 
        offsetY: 3 
      }),
    });
    fabricCanvas.add(watermark);

    // Tagline
    const tagline = new Text("BUILDING CHAMPIONS ON & OFF THE FIELD", {
      left: 540,
      top: 1010,
      fontSize: 18,
      fontWeight: "700",
      fill: "#ffffff",
      textAlign: "center",
      originX: "center",
      fontFamily: "Arial, sans-serif",
      opacity: 0.9,
      letterSpacing: 100,
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
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Social Media Graphic Generator
              </CardTitle>
              <CardDescription>Premium Feature - Requires Paid Membership</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create professional graphics to announce your achievements, offers, commitments, and build your brand with unlimited generations.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Multiple professional templates</span>
            </li>
            <li className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span>Optimized for all social platforms</span>
            </li>
            <li className="flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" />
              <span>High-quality downloads</span>
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
