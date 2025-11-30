import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Video, Lock, Crown } from "lucide-react";

interface MediaBioSectionProps {
  highlightsUrl: string;
  setHighlightsUrl: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  hasPremiumProfile: boolean;
}

export const MediaBioSection = ({
  highlightsUrl,
  setHighlightsUrl,
  bio,
  setBio,
  hasPremiumProfile,
}: MediaBioSectionProps) => {
  const navigate = useNavigate();

  return (
    <Card className="bg-card/80 backdrop-blur border-2 border-secondary/20">
      <CardHeader>
        <CardTitle className="uppercase tracking-tight flex items-center gap-2">
          <Video className="h-5 w-5 text-secondary" />
          Media & Bio
        </CardTitle>
        <CardDescription>Your highlights and personal story</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPremiumProfile ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="highlightsUrl">Highlights Video URL</Label>
              <Input
                id="highlightsUrl"
                type="url"
                value={highlightsUrl}
                onChange={(e) => setHighlightsUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell coaches about yourself..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                {bio.length}/1000 characters
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (Basic)</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setBio(e.target.value);
                  }
                }}
                placeholder="Tell coaches about yourself (200 character limit on free tier)..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {bio.length}/200 characters (free tier limit)
              </p>
            </div>

            <div className="p-6 border-2 border-dashed rounded-lg bg-muted/50 text-center">
              <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold mb-2 flex items-center justify-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                Premium Features Locked
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upgrade to add highlight videos, extended bio (1000 chars), and more advanced profile fields
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
