import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const verificationSchema = z.object({
  email: z.string().email("Please enter a valid email address").max(255, "Email must be less than 255 characters"),
  code: z.string().length(6, "Verification code must be exactly 6 digits").regex(/^\d+$/, "Code must only contain numbers"),
});

const ParentVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [childName, setChildName] = useState("");
  const [resending, setResending] = useState(false);
  const [lastResendTime, setLastResendTime] = useState<number>(0);
  const RESEND_COOLDOWN_MS = 60000; // 1 minute cooldown

  useEffect(() => {
    // Get child name from URL param
    const name = searchParams.get("name");
    if (name) {
      setChildName(decodeURIComponent(name));
    }
  }, [searchParams]);

  const handleVerify = async () => {
    // Validate inputs
    const validation = verificationSchema.safeParse({ email, code });
    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(", ");
      toast.error("Validation Error", { description: errors });
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
    // Rate limiting check
    const now = Date.now();
    const timeSinceLastResend = now - lastResendTime;
    if (timeSinceLastResend < RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLastResend) / 1000);
      toast.error("Please wait before resending", {
        description: `You can resend in ${remainingSeconds} seconds.`
      });
      return;
    }

    // Validate email
    const emailValidation = z.string().email().max(255).safeParse(email);
    if (!emailValidation.success) {
      toast.error("Please enter a valid email address");
      return;
    }

    setResending(true);
    setLastResendTime(now);
    try {
      const { data, error } = await supabase.functions.invoke("resend-parent-verification", {
        body: { 
          parent_email: email,
          app_url: window.location.origin
        },
      });

      if (error) throw error;

      // Check if the function returned an error in the data
      if (data?.error) {
        if (data.error.includes("No verification request found")) {
          toast.error("No verification request found", {
            description: "Please complete the athlete onboarding process first to create a verification request."
          });
        } else if (data.error.includes("already been completed")) {
          toast.error("Verification already completed", {
            description: "This email has already been verified."
          });
        } else {
          toast.error("Unable to resend", {
            description: data.error
          });
        }
        return;
      }

      // Success!
      toast.success("Verification email sent!", {
        description: `Check ${email} for your new verification code.`
      });
      
      // Clear the code field so user knows to enter the new one
      setCode("");
    } catch (error: any) {
      console.error("Resend error:", error);
      
      // Handle specific error messages
      if (error.message?.includes("No verification request found")) {
        toast.error("No verification request found", {
          description: "You need to create a profile before we can send a verification email."
        });
      } else if (error.message?.includes("already been completed")) {
        toast.error("Verification already completed", {
          description: "This verification was already completed."
        });
      } else {
        toast.error("Failed to resend email", {
          description: "Please try again or contact support if the problem persists."
        });
      }
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
