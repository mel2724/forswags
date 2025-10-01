import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";

const CoachApplication = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    experience_years: "",
    certifications: "",
    coaching_background: "",
    why_mentor: "",
    specializations: "",
    twitter_handle: "",
    instagram_handle: "",
    facebook_handle: "",
    tiktok_handle: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePreview, setResumePreview] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Resume must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setResumeFile(file);
      setResumePreview(file.name);
    }
  };

  const removeResume = () => {
    setResumeFile(null);
    setResumePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const specializationsArray = formData.specializations
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      let resumeUrl = null;

      // Upload resume if provided
      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `resumes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(filePath, resumeFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(filePath);

        resumeUrl = publicUrl;
      }

      const { error } = await supabase.from("coach_applications").insert({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        certifications: formData.certifications,
        coaching_background: formData.coaching_background,
        why_mentor: formData.why_mentor,
        specializations: specializationsArray,
        resume_url: resumeUrl,
        twitter_handle: formData.twitter_handle || null,
        instagram_handle: formData.instagram_handle || null,
        facebook_handle: formData.facebook_handle || null,
        tiktok_handle: formData.tiktok_handle || null,
      });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "We'll review your application and get back to you soon.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Apply to be a Coach</CardTitle>
            <CardDescription>
              Help mentor and evaluate student athletes on their recruiting journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience_years">Years of Coaching Experience</Label>
                <Input
                  id="experience_years"
                  name="experience_years"
                  type="number"
                  min="0"
                  value={formData.experience_years}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certifications">Certifications</Label>
                <Textarea
                  id="certifications"
                  name="certifications"
                  value={formData.certifications}
                  onChange={handleChange}
                  placeholder="List any relevant coaching certifications"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specializations">Specializations</Label>
                <Input
                  id="specializations"
                  name="specializations"
                  value={formData.specializations}
                  onChange={handleChange}
                  placeholder="e.g. QB, WR, Defense (comma separated)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coaching_background">Coaching Background *</Label>
                <Textarea
                  id="coaching_background"
                  name="coaching_background"
                  value={formData.coaching_background}
                  onChange={handleChange}
                  placeholder="Tell us about your coaching experience and background"
                  required
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="why_mentor">Why do you want to mentor student athletes? *</Label>
                <Textarea
                  id="why_mentor"
                  name="why_mentor"
                  value={formData.why_mentor}
                  onChange={handleChange}
                  placeholder="Share your motivation for mentoring"
                  required
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume">Resume</Label>
                <div className="space-y-2">
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('resume')?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {resumePreview ? "Change Resume" : "Upload Resume"}
                  </Button>
                  {resumePreview && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <span className="text-sm truncate">{resumePreview}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeResume}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">PDF, DOC, or DOCX (max 5MB)</p>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Social Media Handles (Optional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter_handle">X (Twitter)</Label>
                    <Input
                      id="twitter_handle"
                      name="twitter_handle"
                      value={formData.twitter_handle}
                      onChange={handleChange}
                      placeholder="@username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram_handle">Instagram</Label>
                    <Input
                      id="instagram_handle"
                      name="instagram_handle"
                      value={formData.instagram_handle}
                      onChange={handleChange}
                      placeholder="@username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook_handle">Facebook</Label>
                    <Input
                      id="facebook_handle"
                      name="facebook_handle"
                      value={formData.facebook_handle}
                      onChange={handleChange}
                      placeholder="username or profile URL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiktok_handle">TikTok</Label>
                    <Input
                      id="tiktok_handle"
                      name="tiktok_handle"
                      value={formData.tiktok_handle}
                      onChange={handleChange}
                      placeholder="@username"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Application
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoachApplication;
