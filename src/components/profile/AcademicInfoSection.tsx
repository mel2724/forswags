import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Lock, Crown } from "lucide-react";

interface AcademicInfoSectionProps {
  highSchool: string;
  setHighSchool: (value: string) => void;
  gradYear: string;
  setGradYear: (value: string) => void;
  gpa: string;
  setGpa: (value: string) => void;
  satScore: string;
  setSatScore: (value: string) => void;
  actScore: string;
  setActScore: (value: string) => void;
  hasPremiumProfile: boolean;
}

export const AcademicInfoSection = ({
  highSchool,
  setHighSchool,
  gradYear,
  setGradYear,
  gpa,
  setGpa,
  satScore,
  setSatScore,
  actScore,
  setActScore,
  hasPremiumProfile,
}: AcademicInfoSectionProps) => {
  const navigate = useNavigate();

  return (
    <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="uppercase tracking-tight flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Academic Information
        </CardTitle>
        <CardDescription>Your education and test scores</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="highSchool">High School</Label>
            <Input
              id="highSchool"
              value={highSchool}
              onChange={(e) => setHighSchool(e.target.value)}
              placeholder="Central High School"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gradYear">Graduation Year</Label>
            <Input
              id="gradYear"
              type="number"
              value={gradYear}
              onChange={(e) => setGradYear(e.target.value)}
              placeholder="2025"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gpa">GPA</Label>
          <Input
            id="gpa"
            type="number"
            step="0.01"
            value={gpa}
            onChange={(e) => setGpa(e.target.value)}
            placeholder="3.75"
          />
        </div>

        {hasPremiumProfile ? (
          <>
            <Separator />
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="satScore">SAT Score</Label>
                <Input
                  id="satScore"
                  type="number"
                  value={satScore}
                  onChange={(e) => setSatScore(e.target.value)}
                  placeholder="1200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actScore">ACT Score</Label>
                <Input
                  id="actScore"
                  type="number"
                  value={actScore}
                  onChange={(e) => setActScore(e.target.value)}
                  placeholder="28"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <Separator />
            <div className="p-6 border-2 border-dashed rounded-lg bg-muted/50 text-center">
              <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold mb-2 flex items-center justify-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                Premium Feature
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add SAT/ACT scores and advanced academic information with a premium membership
              </p>
              <Button onClick={() => navigate('/membership')} size="sm">
                Upgrade to Premium
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
