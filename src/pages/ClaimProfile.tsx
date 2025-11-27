import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import logoFull from "@/assets/forswags-logo.png";

export default function ClaimProfile() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [athleteData, setAthleteData] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      // Check athletes table first
      const { data: athleteData } = await supabase
        .from("athletes")
        .select(`
          *,
          profiles!athletes_user_id_fkey (
            email,
            full_name
          )
        `)
        .eq("claim_token", token)
        .maybeSingle();

      // Check alumni table if not found in athletes
      const { data: alumniData } = await supabase
        .from("alumni")
        .select(`
          *,
          profiles!alumni_user_id_fkey (
            email,
            full_name
          )
        `)
        .eq("claim_token", token)
        .maybeSingle();

      const data = athleteData || alumniData;

      if (!data) {
        toast.error("Invalid or expired claim link");
        navigate("/");
        return;
      }

      if (data.profile_claimed) {
        toast.error("This profile has already been claimed");
        navigate("/auth");
        return;
      }

      if (new Date(data.claim_token_expires_at) < new Date()) {
        toast.error("This claim link has expired");
        navigate("/");
        return;
      }

      setAthleteData(data);
    } catch (error) {
      console.error("Token validation error:", error);
      toast.error("Failed to validate claim link");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setClaiming(true);

    try {
      // Call secure edge function to claim profile
      const { data, error } = await supabase.functions.invoke("claim-athlete-profile", {
        body: {
          claim_token: token,
          password,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: athleteData.profiles.email,
        password,
      });

      if (signInError) throw signInError;

      toast.success("Profile claimed successfully! Complete your profile to get started.");
      navigate("/onboarding?claimed=true");
    } catch (error: any) {
      console.error("Claim error:", error);
      toast.error(error.message || "Failed to claim profile");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <img src={logoFull} alt="ForSwags" className="h-16" />
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Claim Your Profile</CardTitle>
            <CardDescription>
              Welcome, {athleteData?.profiles?.full_name}! Set up your password to claim your ForSwags profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleClaimProfile} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={athleteData?.profiles?.email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Create Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">What's Next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc ml-4">
                  <li>Complete your athletic profile</li>
                  <li>Upload highlights and stats</li>
                  <li>Get evaluated by coaches</li>
                  <li>Connect with college recruiters</li>
                  <li>Upgrade to unlock premium features</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={claiming}
              >
                {claiming ? "Claiming Profile..." : "Claim Profile & Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/auth" className="text-primary hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}