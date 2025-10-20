import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import logoFull from "@/assets/forswags-logo.png";
import { SEO } from "@/components/SEO";

const ComingSoon = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleType = searchParams.get('role') || 'recruiter';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    organization: "",
    sport: "",
    level: "",
    location: "",
    howHeard: "",
    additionalNotes: "",
    subscribeUpdates: true,
    interestedInBeta: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('waitlist_signups')
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          role: roleType,
          organization: formData.organization,
          sport: formData.sport,
          level: formData.level,
          location: formData.location,
          how_heard: formData.howHeard,
          additional_notes: formData.additionalNotes,
          subscribe_updates: formData.subscribeUpdates,
          interested_in_beta: formData.interestedInBeta,
        });

      if (error) throw error;

      // Send confirmation email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-waitlist-confirmation', {
          body: {
            name: formData.fullName,
            email: formData.email,
            role: roleType,
          },
        });

        if (emailError) {
          console.error('Email sending failed:', emailError);
          // Don't fail the whole process if email fails
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      toast.success("Thank you! Check your email for confirmation.");
      
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        organization: "",
        sport: "",
        level: "",
        location: "",
        howHeard: "",
        additionalNotes: "",
        subscribeUpdates: true,
        interestedInBeta: false,
      });
    } catch (error: any) {
      toast.error(error.message || "Error submitting form");
    } finally {
      setLoading(false);
    }
  };

  const roleTitle = roleType === 'parent' ? 'Parent Portal' : 'College Coach Recruiting Network';
  const roleDescription = roleType === 'parent' 
    ? 'Stay connected with your athlete\'s journey, receive updates tailored to supporting their college recruiting path, and access parent-specific resources when we launch.'
    : 'Search and evaluate athlete profiles, get notified regarding your watchlists, and receive updates tailored to your recruiting needs inside our college recruiting network when we launch.';

  return (
    <>
      <SEO 
        title={`${roleTitle} - Coming Soon | ForSWAGs`}
        description={roleDescription}
      />
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoFull} alt="ForSWAGs" className="h-12" />
          </div>
          
          <Button variant="ghost" onClick={() => navigate("/")} className="text-primary hover:text-primary/80 font-bold">
            Back to Home
          </Button>
        </div>
      </header>

      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-primary/20 bg-card/80 backdrop-blur">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-4xl">🚀</span>
              </div>
              <CardTitle className="text-4xl font-black uppercase tracking-tight glow-text">
                {roleTitle} — Coming Soon
              </CardTitle>
              <CardDescription className="text-base">
                {roleDescription}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="mb-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h3 className="font-bold text-lg mb-2">Get Early Access</h3>
                <p className="text-sm text-muted-foreground">
                  Tell us about yourself and we'll invite you to the {roleType === 'parent' ? 'Parent' : 'Coach'} Portal.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Jane Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organization">{roleType === 'parent' ? 'School/Club' : 'Organization'}</Label>
                    <Input
                      id="organization"
                      placeholder={roleType === 'parent' ? 'Student\'s High School' : 'University Name'}
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sport">Sport</Label>
                    <Input
                      id="sport"
                      placeholder="e.g., Soccer"
                      value={formData.sport}
                      onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high-school">High School</SelectItem>
                      <SelectItem value="juco">Junior College</SelectItem>
                      <SelectItem value="d1">Division I</SelectItem>
                      <SelectItem value="d2">Division II</SelectItem>
                      <SelectItem value="d3">Division III</SelectItem>
                      <SelectItem value="naia">NAIA</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="City, State/Region"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="howHeard">How did you hear about us?</Label>
                  <Input
                    id="howHeard"
                    placeholder="Referral, Search, Social Media..."
                    value={formData.howHeard}
                    onChange={(e) => setFormData({ ...formData, howHeard: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">Any specific needs or questions?</Label>
                  <Textarea
                    id="additionalNotes"
                    placeholder="Tell us what features would be most valuable to you..."
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="space-y-0.5">
                      <Label htmlFor="subscribe" className="text-base">Subscribe to updates</Label>
                      <p className="text-sm text-muted-foreground">Receive news about our launch</p>
                    </div>
                    <Switch
                      id="subscribe"
                      checked={formData.subscribeUpdates}
                      onCheckedChange={(checked) => setFormData({ ...formData, subscribeUpdates: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="space-y-0.5">
                      <Label htmlFor="beta" className="text-base">Interested in beta</Label>
                      <p className="text-sm text-muted-foreground">Get early access to test features</p>
                    </div>
                    <Switch
                      id="beta"
                      checked={formData.interestedInBeta}
                      onCheckedChange={(checked) => setFormData({ ...formData, interestedInBeta: checked })}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-hero text-lg py-6" 
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Notify Me"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an athlete account?{" "}
              <button
                onClick={() => navigate("/auth")}
                className="text-primary hover:underline font-semibold"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ComingSoon;
