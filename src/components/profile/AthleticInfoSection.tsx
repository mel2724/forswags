import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trophy, Ruler, Weight } from "lucide-react";

const sports = [
  "Football", "Basketball", "Baseball", "Softball", "Soccer", 
  "Track & Field", "Volleyball", "Lacrosse", "Tennis", 
  "Swimming", "Wrestling", "Golf", "Cross Country", "Other"
];

interface AthleticInfoSectionProps {
  sport: string;
  setSport: (value: string) => void;
  position: string;
  setPosition: (value: string) => void;
  heightFeet: string;
  setHeightFeet: (value: string) => void;
  heightInches: string;
  setHeightInches: (value: string) => void;
  weight: string;
  setWeight: (value: string) => void;
}

export const AthleticInfoSection = ({
  sport,
  setSport,
  position,
  setPosition,
  heightFeet,
  setHeightFeet,
  heightInches,
  setHeightInches,
  weight,
  setWeight,
}: AthleticInfoSectionProps) => {
  return (
    <Card className="bg-card/80 backdrop-blur border-2 border-secondary/20">
      <CardHeader>
        <CardTitle className="uppercase tracking-tight flex items-center gap-2">
          <Trophy className="h-5 w-5 text-secondary" />
          Athletic Information
        </CardTitle>
        <CardDescription>Your sport and position details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sport">Sport *</Label>
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger>
                <SelectValue placeholder="Select your sport" />
              </SelectTrigger>
              <SelectContent>
                {sports.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g., Quarterback, Point Guard"
            />
          </div>
        </div>

        <Separator />

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Height
            </Label>
            <div className="flex gap-3">
              <Input
                type="number"
                value={heightFeet}
                onChange={(e) => setHeightFeet(e.target.value)}
                placeholder="Feet"
                min="3"
                max="8"
              />
              <Input
                type="number"
                value={heightInches}
                onChange={(e) => setHeightInches(e.target.value)}
                placeholder="Inches"
                min="0"
                max="11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight" className="flex items-center gap-2">
              <Weight className="h-4 w-4" />
              Weight (lbs)
            </Label>
            <Input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="175"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
