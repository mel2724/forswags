import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";

interface PersonalInfoSectionProps {
  fullName: string;
  setFullName: (value: string) => void;
  email: string;
  username: string;
  setUsername: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  avatarUrl: string | null;
  setAvatarUrl: (value: string | null) => void;
}

export const PersonalInfoSection = ({
  fullName,
  setFullName,
  email,
  username,
  setUsername,
  phone,
  setPhone,
  avatarUrl,
  setAvatarUrl,
}: PersonalInfoSectionProps) => {
  return (
    <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="uppercase tracking-tight flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Personal Information
        </CardTitle>
        <CardDescription>Your basic contact details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              disabled
              className="bg-muted cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Profile Username *</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="john-smith"
          />
          <p className="text-xs text-muted-foreground">
            Your public profile URL: forswags.com/athlete/{username || 'your-username'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>

        <ProfilePictureUpload
          currentImageUrl={avatarUrl}
          onImageUpdate={setAvatarUrl}
          userInitials={fullName.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
          size="md"
        />
      </CardContent>
    </Card>
  );
};
