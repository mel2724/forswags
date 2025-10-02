import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { Accessibility, Type, Contrast, Gauge } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function AccessibilityMenu() {
  const {
    textSize,
    setTextSize,
    contrastMode,
    setContrastMode,
    reducedMotion,
    setReducedMotion,
  } = useAccessibility();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Accessibility settings"
          title="Accessibility settings"
        >
          <Accessibility className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Accessibility className="h-4 w-4" />
              Accessibility Settings
            </h4>
            <p className="text-sm text-muted-foreground">
              Customize your viewing experience
            </p>
          </div>

          <Separator />

          {/* Text Size Control */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Text Size
            </Label>
            <RadioGroup
              value={textSize}
              onValueChange={(value) => setTextSize(value as any)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="small" id="text-small" />
                <Label htmlFor="text-small" className="font-normal cursor-pointer">
                  Small (14px)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="text-medium" />
                <Label htmlFor="text-medium" className="font-normal cursor-pointer">
                  Medium (16px)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="large" id="text-large" />
                <Label htmlFor="text-large" className="font-normal cursor-pointer">
                  Large (18px)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="x-large" id="text-xlarge" />
                <Label htmlFor="text-xlarge" className="font-normal cursor-pointer">
                  Extra Large (20px)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Contrast Mode */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Contrast className="h-4 w-4" />
              Contrast Mode
            </Label>
            <RadioGroup
              value={contrastMode}
              onValueChange={(value) => setContrastMode(value as any)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="contrast-normal" />
                <Label htmlFor="contrast-normal" className="font-normal cursor-pointer">
                  Normal Contrast
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="contrast-high" />
                <Label htmlFor="contrast-high" className="font-normal cursor-pointer">
                  High Contrast
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <Label htmlFor="reduced-motion" className="flex items-center gap-2 cursor-pointer">
              <Gauge className="h-4 w-4" />
              Reduce Motion
            </Label>
            <Switch
              id="reduced-motion"
              checked={reducedMotion}
              onCheckedChange={setReducedMotion}
              aria-label="Toggle reduced motion"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            These settings are saved automatically and persist across sessions.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
