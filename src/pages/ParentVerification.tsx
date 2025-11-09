import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const ParentVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [childName, setChildName] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // Get child name from URL param
    const name = searchParams.get("name");
    if (name) {
      setChildName(decodeURIComponent(name));
    }
  }, [searchParams]);

  const handleVerify = async () => {
    if (!email || !code) {
      toast.error("Please enter both email and verification code");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-parent-code", {
        body: { parent_email: email, verification_code: code },
      });

      if (error) throw error;

      if (data?.valid) {
        setVerified(true);
        toast.success("Email verified! Your child's profile is now public.");
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        toast.error(data?.error || "Invalid or expired verification code");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error("Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.functions.invoke("resend-parent-verification", {
        body: { 
          parent_email: email,
          app_url: window.location.origin
        },
      });

      if (error) throw error;

      toast.success("Verification email sent! Check your inbox.");
    } catch (error: any) {
      console.error("Resend error:", error);
      toast.error(error.message || "Failed to resend email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">Verification Complete!</h1>
          <p className="text-muted-foreground">
            Thank you for verifying {childName ? `${childName}'s` : "your child's"} profile.
            Their athletic profile is now visible to college recruiters.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting you to the homepage...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Parent Verification</h1>
          <p className="text-muted-foreground">
            Verify your email to make {childName ? `${childName}'s` : "your child's"} profile public
          </p>
        </div>

        <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                COPPA Compliance Required
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Federal law requires parental consent before children under 13 can have public profiles.
                Enter the verification code sent to your email to complete the process.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Parent/Guardian Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Check your email for the 6-digit verification code. Code expires in 24 hours.
            </p>
          </div>
        </div>

        <Button 
          onClick={handleVerify} 
          className="w-full" 
          disabled={loading || code.length !== 6}
        >
          {loading ? "Verifying..." : "Verify Email"}
        </Button>

        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Didn't receive the email?
          </p>
          <Button
            variant="secondary"
            onClick={handleResend}
            disabled={resending || !email}
            className="w-full"
          >
            {resending ? "Sending..." : "Resend Verification Email"}
          </Button>
          {!email && (
            <p className="text-xs text-muted-foreground">
              Enter your email address above to enable resend
            </p>
          )}
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Need help? Contact us at{" "}
            <a href="mailto:support@forswags.com" className="text-primary hover:underline">
              support@forswags.com
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ParentVerification;
