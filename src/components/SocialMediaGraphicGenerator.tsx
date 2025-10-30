import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, FabricImage, Textbox, Shadow } from "fabric";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Upload, Image as ImageIcon } from "lucide-react";
import logoFull from "@/assets/logo-text.png";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UpgradePromptDialog } from "@/components/UpgradePromptDialog";

interface GraphicTemplate {
  type: "commitment" | "offer" | "achievement";
  title: string;
  description: string;
}

const TEMPLATES: GraphicTemplate[] = [
  { type: "commitment", title: "Commitment Announcement", description: "Professional college commitment graphic" },
  { type: "offer", title: "Scholarship Offer", description: "Celebrate a new offer" },
  { type: "achievement", title: "Achievement", description: "Share an accomplishment" },
];

interface SocialMediaGraphicGeneratorProps {
  athleteName?: string;
  athleteSport?: string;
}

export const SocialMediaGraphicGenerator = ({ athleteName = "", athleteSport = "" }: SocialMediaGraphicGeneratorProps) => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<GraphicTemplate>(TEMPLATES[0]);
  const [schoolName, setSchoolName] = useState("");
  const [classYear, setClassYear] = useState("");
  const [athleteSignature, setAthleteSignature] = useState(athleteName || "");
  const [primaryColor, setPrimaryColor] = useState("#4C1D95");
  const [secondaryColor, setSecondaryColor] = useState("#FFD623");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { hasAccess, isLoading } = useFeatureAccess("social_media_graphics");

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1080,
      height: 1080,
      backgroundColor: "#ffffff",
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  // Removed profile image fetching - users will upload their own photo

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      toast.success("Image uploaded! Click Generate to create your graphic.");
    };
    reader.readAsDataURL(file);
  };

  const generateGraphic = async () => {
    if (!fabricCanvas) return;
    
    if (!uploadedImage && selectedTemplate.type === "commitment") {
      toast.error("Please upload a photo for commitment graphics");
      return;
    }

    if (!schoolName) {
      toast.error("Please enter a school name");
      return;
    }

    setLoading(true);

    try {
      fabricCanvas.clear();
      
      const bgRect = new Rect({
        left: 0,
        top: 0,
        width: 1080,
        height: 1080,
        fill: primaryColor,
        selectable: false,
      });
      fabricCanvas.add(bgRect);

      if (selectedTemplate.type === "commitment") {
        await addCommitmentGraphic(uploadedImage);
      } else if (selectedTemplate.type === "offer") {
        await addOfferGraphic(uploadedImage);
      } else {
        await addAchievementGraphic(uploadedImage);
      }

      await addWatermark();

      fabricCanvas.renderAll();
      toast.success("Graphic generated! You can now download it.");
    } catch (error) {
      console.error("Error generating graphic:", error);
      toast.error("Failed to generate graphic");
    } finally {
      setLoading(false);
    }
  };

  const addWatermark = async () => {
    if (!fabricCanvas) return;

    return new Promise<void>((resolve) => {
      FabricImage.fromURL(logoFull).then((img) => {
        img.set({
          left: 540,
          top: 1020,
          originX: 'center',
          originY: 'center',
          opacity: 0.85,
          selectable: false,
        });
        
        const scale = 180 / (img.width || 1);
        img.scale(scale);
        
        fabricCanvas.add(img);
        resolve();
      }).catch(() => resolve());
    });
  };

  const addCommitmentGraphic = async (imageUrl: string | null) => {
    if (!fabricCanvas) return;

      const topRect = new Rect({
        left: 0,
        top: 0,
        width: 1080,
        height: 250,
        fill: secondaryColor,
        selectable: false,
      });
      fabricCanvas.add(topRect);

      const universityText = new Textbox("THE UNIVERSITY OF", {
        left: 540,
        top: 50,
        width: 900,
        fontSize: 28,
        fontWeight: "700",
        fill: primaryColor,
        textAlign: "center",
        originX: "center",
        fontFamily: "Arial, sans-serif",
        selectable: false,
      });
      fabricCanvas.add(universityText);

      const schoolText = new Textbox(schoolName.toUpperCase(), {
        left: 540,
        top: 110,
        width: 900,
        fontSize: 68,
        fontWeight: "900",
        fill: primaryColor,
        textAlign: "center",
        originX: "center",
        fontFamily: "Impact, Arial Black, sans-serif",
        shadow: new Shadow({ 
          color: "rgba(0,0,0,0.3)", 
          blur: 10, 
          offsetX: 0, 
          offsetY: 4 
        }),
        selectable: false,
      });
      fabricCanvas.add(schoolText);

    const committedBg = new Rect({
      left: 80,
      top: 300,
      width: 280,
      height: 80,
      fill: secondaryColor,
      selectable: false,
    });
    fabricCanvas.add(committedBg);

    const committedText = new Textbox("COMMITTED", {
      left: 220,
      top: 320,
      width: 250,
      fontSize: 38,
      fontWeight: "900",
      fill: primaryColor,
      textAlign: "center",
      originX: "center",
      fontFamily: "Impact, Arial Black, sans-serif",
      selectable: false,
    });
    fabricCanvas.add(committedText);

    if (imageUrl) {
      await new Promise<void>((resolve) => {
        FabricImage.fromURL(imageUrl).then((img) => {
          const frameBg = new Rect({
            left: 150,
            top: 420,
            width: 400,
            height: 480,
            fill: "#ffffff",
            angle: -3,
            shadow: new Shadow({ 
              color: "rgba(0,0,0,0.3)", 
              blur: 20, 
              offsetX: 5, 
              offsetY: 10 
            }),
            selectable: false,
          });
          fabricCanvas.add(frameBg);

          // Use Math.max to ensure image covers the entire frame area
          const scale = Math.max(360 / (img.width || 1), 360 / (img.height || 1));
          img.scale(scale);
          img.set({
            left: 350,
            top: 600,
            originX: 'center',
            originY: 'center',
            angle: -3,
            clipPath: new Rect({
              width: 360,
              height: 360,
              originX: 'center',
              originY: 'center',
            }),
            selectable: false,
          });
          fabricCanvas.add(img);

          if (athleteSignature) {
            const signature = new Textbox(athleteSignature, {
              left: 350,
              top: 810,
              width: 360,
              fontSize: 28,
              fill: "#333333",
              textAlign: "center",
              originX: "center",
              fontFamily: "Brush Script MT, cursive",
              angle: -3,
              selectable: false,
            });
            fabricCanvas.add(signature);
          }

          resolve();
        }).catch(() => resolve());
      });
    }

    if (classYear) {
      const classText = new Textbox(`Class of ${classYear}`, {
        left: 740,
        top: 500,
        width: 500,
        fontSize: 48,
        fontWeight: "700",
        fill: "#ffffff",
        textAlign: "left",
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        selectable: false,
      });
      fabricCanvas.add(classText);
    }

    if (athleteSport) {
      const sportBg = new Rect({
        left: 620,
        top: 600,
        width: 380,
        height: 60,
        fill: "rgba(255,255,255,0.2)",
        selectable: false,
      });
      fabricCanvas.add(sportBg);

      const sportText = new Textbox(athleteSport.toUpperCase(), {
        left: 810,
        top: 615,
        width: 350,
        fontSize: 32,
        fontWeight: "700",
        fill: "#ffffff",
        textAlign: "center",
        originX: "center",
        fontFamily: "Arial, sans-serif",
        selectable: false,
      });
      fabricCanvas.add(sportText);
    }
  };

  const addOfferGraphic = async (imageUrl: string | null) => {
    if (!fabricCanvas) return;

    const title = new Textbox("BLESSED TO RECEIVE AN OFFER", {
      left: 540,
      top: 150,
      width: 900,
      fontSize: 56,
      fontWeight: "900",
      fill: "#ffffff",
      textAlign: "center",
      originX: "center",
      fontFamily: "Impact, Arial Black, sans-serif",
      shadow: new Shadow({ 
        color: "rgba(0,0,0,0.5)", 
        blur: 15, 
        offsetX: 0, 
        offsetY: 5 
      }),
      selectable: false,
    });
    fabricCanvas.add(title);

    const schoolBg = new Rect({
      left: 0,
      top: 300,
      width: 1080,
      height: 180,
      fill: secondaryColor,
      selectable: false,
    });
    fabricCanvas.add(schoolBg);

    const schoolText = new Textbox(schoolName.toUpperCase(), {
      left: 540,
      top: 350,
      width: 900,
      fontSize: 80,
      fontWeight: "900",
      fill: primaryColor,
      textAlign: "center",
      originX: "center",
      fontFamily: "Impact, Arial Black, sans-serif",
      selectable: false,
    });
    fabricCanvas.add(schoolText);

    if (imageUrl) {
      await new Promise<void>((resolve) => {
        FabricImage.fromURL(imageUrl).then((img) => {
          // Use Math.max to ensure image covers the circular frame
          const scale = Math.max(400 / (img.width || 1), 400 / (img.height || 1));
          img.scale(scale);
          img.set({
            left: 540,
            top: 700,
            originX: 'center',
            originY: 'center',
            clipPath: new Rect({
              width: 400,
              height: 400,
              originX: 'center',
              originY: 'center',
              rx: 200,
              ry: 200,
            }),
            selectable: false,
          });
          fabricCanvas.add(img);
          resolve();
        }).catch(() => resolve());
      });
    }

    if (athleteSignature) {
      const name = new Textbox(athleteSignature, {
        left: 540,
        top: 950,
        width: 700,
        fontSize: 36,
        fill: "#ffffff",
        textAlign: "center",
        originX: "center",
        fontFamily: "Arial, sans-serif",
        fontStyle: "italic",
        selectable: false,
      });
      fabricCanvas.add(name);
    }
  };

  const addAchievementGraphic = async (imageUrl: string | null) => {
    if (!fabricCanvas) return;

    const title = new Textbox(schoolName.toUpperCase() || "NEW ACHIEVEMENT", {
      left: 540,
      top: 200,
      width: 900,
      fontSize: 72,
      fontWeight: "900",
      fill: "#ffffff",
      textAlign: "center",
      originX: "center",
      fontFamily: "Impact, Arial Black, sans-serif",
      shadow: new Shadow({ 
        color: "rgba(0,0,0,0.5)", 
        blur: 15, 
        offsetX: 0, 
        offsetY: 5 
      }),
      selectable: false,
    });
    fabricCanvas.add(title);

    if (imageUrl) {
      await new Promise<void>((resolve) => {
        FabricImage.fromURL(imageUrl).then((img) => {
          // Use Math.max to ensure image covers the designated area
          const scale = Math.max(500 / (img.width || 1), 500 / (img.height || 1));
          img.scale(scale);
          img.set({
            left: 540,
            top: 600,
            originX: 'center',
            originY: 'center',
            selectable: false,
          });
          fabricCanvas.add(img);
          resolve();
        }).catch(() => resolve());
      });
    }

    if (athleteSignature) {
      const name = new Textbox(athleteSignature, {
        left: 540,
        top: 950,
        width: 700,
        fontSize: 40,
        fill: "#ffffff",
        textAlign: "center",
        originX: "center",
        fontFamily: "Arial, sans-serif",
        selectable: false,
      });
      fabricCanvas.add(name);
    }
  };

  const downloadGraphic = () => {
    if (!fabricCanvas) return;

    // Force a render to ensure all elements are drawn
    fabricCanvas.renderAll();

    // Small delay to ensure rendering completes
    setTimeout(() => {
      const dataURL = fabricCanvas.toDataURL({
        format: "png",
        quality: 1.0,
        multiplier: 2,
      });

      const link = document.createElement("a");
      link.download = `${selectedTemplate.type}-${schoolName.replace(/\s+/g, "-")}.png`;
      link.href = dataURL;
      link.click();

      toast.success("Graphic downloaded!");
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-6 h-6" />
            Social Media Graphics - Premium Feature
          </CardTitle>
          <CardDescription>
            Create professional commitment announcements and graphics to share on social media
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This feature is available with a premium membership. Upgrade to create professional commitment announcements and graphics.
          </p>
          <Button size="lg" onClick={() => navigate("/membership")}>
            Upgrade to Access Graphics Generator
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
            <ImageIcon className="w-6 h-6" />
            Social Media Graphics Generator
          </CardTitle>
          <CardDescription>
            Create professional college commitment and announcement graphics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">Graphic Type</Label>
              <Select
                value={selectedTemplate.type}
                onValueChange={(value) => {
                  const template = TEMPLATES.find((t) => t.type === value);
                  if (template) setSelectedTemplate(template);
                }}
              >
                <SelectTrigger id="template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((template) => (
                    <SelectItem key={template.type} value={template.type}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="school">School Name *</Label>
                <Input
                  id="school"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g., LSU, Pittsburgh"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="classYear">Class Year</Label>
                <Input
                  id="classYear"
                  value={classYear}
                  onChange={(e) => setClassYear(e.target.value)}
                  placeholder="e.g., 2027"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature">Your Name / Signature</Label>
              <Input
                id="signature"
                value={athleteSignature}
                onChange={(e) => setAthleteSignature(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color (School Color)</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-20"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#4C1D95"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color (Accent)</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-20"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#FFD623"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Photo *</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadedImage ? "Change Photo" : "Upload Photo"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                Upload a high-quality photo of yourself (headshot or action shot). Best results with JPG or PNG files. 
                {uploadedImage && " ✓ Photo uploaded"}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={generateGraphic}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Generating..." : "Generate Graphic"}
              </Button>
              <Button
                onClick={downloadGraphic}
                disabled={loading}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-muted/20 flex items-center justify-center overflow-auto">
            <canvas ref={canvasRef} className="mx-auto max-w-full" style={{ width: '450px', height: '450px' }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
