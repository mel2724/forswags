import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import logoFull from "@/assets/forswags-logo.png";

// Password strength checker
const checkPasswordStrength = (password: string) => {
  let strength = 0;
  let feedback = [];

  if (password.length >= 12) strength += 2;
  else if (password.length >= 8) strength += 1;
  else feedback.push("Use at least 8 characters");

  if (/[a-z]/.test(password)) strength += 1;
  else feedback.push("Add lowercase letters");

  if (/[A-Z]/.test(password)) strength += 1;
  else feedback.push("Add uppercase letters");

  if (/[0-9]/.test(password)) strength += 1;
  else feedback.push("Add numbers");

  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  else feedback.push("Add special characters (!@#$%^&*)");

  // Check for common patterns
  const commonPatterns = ['password', 'test', '1234', 'qwerty', 'abc'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    strength -= 2;
    feedback.push("Avoid common words or patterns");
  }

  return {
    strength: Math.max(0, Math.min(5, strength)),
    feedback,
    label: strength >= 5 ? 'Strong' : strength >= 3 ? 'Medium' : 'Weak'
  };
};

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isStaffSignup, setIsStaffSignup] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, feedback: [], label: 'Weak' });
  const [showManualContinue, setShowManualContinue] = useState(false);
  const [lastResetAttempt, setLastResetAttempt] = useState<number>(0);

  const RESET_COOLDOWN_MS = 60000; // 1 minute

  useEffect(() => {
    // Check if this is a college staff signup
    const params = new URLSearchParams(window.location.search);
    setIsStaffSignup(params.get('type') === 'staff');
    
    // Rest of the existing code
    // Check for password recovery tokens in URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (accessToken && type === 'recovery') {
      setIsResettingPassword(true);
      return;
    }

    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Sync membership status on sign in
      if (event === "SIGNED_IN" && session) {
        try {
          await supabase.functions.invoke("check-subscription", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          console.log("[AUTH] Membership status synced after sign in");
        } catch (error) {
          console.error("[AUTH] Failed to sync membership:", error);
        }
      }
      
      // Navigate to dashboard for existing users, don't interfere with signup flow
      if (event === "SIGNED_IN" && session && window.location.pathname === "/auth") {
        return;
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Password strength validation
    const strength = checkPasswordStrength(password);
    if (strength.strength < 3) {
      toast.error("Password is too weak", {
        description: strength.feedback.join(", "),
        duration: 5000,
      });
      return;
    }
    
    if (!termsAccepted) {
      toast.error("Please accept the Terms and Conditions to continue");
      return;
    }
    
    if (!privacyAccepted) {
      toast.error("Please accept the Privacy Policy to continue");
      return;
    }
    
    // Validate .edu email for college staff signups
    if (isStaffSignup && !email.toLowerCase().endsWith('.edu')) {
      toast.error("College staff must sign up with a valid .edu email address");
      return;
    }
    
    setLoading(true);
    setShowManualContinue(false);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (authError) throw authError;

      // Create or update profile with terms and privacy acceptance
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: authData.user.email!,
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString(),
            privacy_accepted: true,
            privacy_accepted_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error("Error creating profile:", profileError);
          // Don't throw here, profile creation is secondary
        }
      }

      toast.success("Account created! Redirecting...");

      // Fallback navigation after 2 seconds if onAuthStateChange doesn't fire
      setTimeout(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            navigate("/onboarding");
          } else {
            // Session couldn't be saved, show manual continue button
            setShowManualContinue(true);
            toast.info("Account created! Click Continue to proceed.", { duration: 5000 });
          }
        } catch (e) {
          console.error("Session check error:", e);
          setShowManualContinue(true);
        }
        setLoading(false);
      }, 2000);

    } catch (error: any) {
      setLoading(false);
      
      console.error("Signup error:", error);
      
      // Handle specific error cases with better messaging
      const errorMsg = error.message?.toLowerCase() || '';
      const errorCode = error.code?.toLowerCase() || '';
      
      if (errorCode === 'user_already_exists' || 
          errorMsg.includes('already registered') ||
          errorMsg.includes('already exists')) {
        toast.error("Email Already Registered!", {
          description: "This email already has an account. Please use the Login tab instead, or use a different email address.",
          duration: 8000,
        });
      } else if (errorMsg.includes('weak_password') ||
          errorMsg.includes('password is too weak') ||
          errorMsg.includes('password does not meet') ||
          errorMsg.includes('pwned')) {
        toast.error(
          "Password not secure enough. Please use a unique, strong password with uppercase, lowercase, numbers, and special characters.",
          { duration: 6000 }
        );
      } else if (errorMsg.includes('quota') || 
                 errorMsg.includes('storage') ||
                 error.name === 'QuotaExceededError') {
        toast.error(
          "Browser storage is full. Please clear your browser's localStorage (F12 → Application → Local Storage → Clear) and try again.",
          { duration: 8000 }
        );
      } else {
        toast.error(error.message || "Error creating account");
      }
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Sign in attempt:", { email, password: password ? "***" : "empty" });
    
    // Input validation
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setLoading(true);

    // Clear localStorage to prevent quota errors
    try {
      localStorage.clear();
      console.log("Cleared localStorage");
    } catch (clearError) {
      console.warn("Could not clear localStorage:", clearError);
    }

    try {
      // Now using sessionStorage in main client to avoid localStorage quota issues
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Check if user can login (membership status)
      if (authData.user) {
        try {
          const { data: loginCheck, error: checkError } = await supabase.rpc('can_user_login', {
            p_user_id: authData.user.id
          });

          if (checkError) {
            console.warn("Membership check failed:", checkError);
          } else {
            const loginStatus = loginCheck as unknown as { can_login: boolean; reason: string };
            
            if (!loginStatus.can_login) {
              await supabase.auth.signOut();
              
              if (loginStatus.reason === 'membership_expired') {
                toast.error('Your membership has expired. Please renew to continue accessing your account.');
              } else if (loginStatus.reason === 'payment_failed') {
                toast.error('Your payment has failed. Please update your payment method to continue.');
              } else {
                toast.error('Unable to login. Please contact support.');
              }
              setLoading(false);
              return;
            }
          }
        } catch (membershipError) {
          console.warn("Membership check error:", membershipError);
        }

        // Check if user has completed onboarding
        try {
          console.log("Checking user role for:", authData.user.id);
          const { data: rolesData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", authData.user.id);

          if (roleError) {
            console.error("Role check error:", roleError);
          }
          
          console.log("User roles data:", rolesData);
          
          // If user has no roles, they didn't complete onboarding
          if (!rolesData || rolesData.length === 0) {
            toast.info("Please complete your profile setup");
            navigate("/onboarding");
            setLoading(false);
            return;
          }
          
          // Check if user is admin
          const isAdmin = rolesData?.some(r => r.role === "admin");
          console.log("Is admin:", isAdmin);
          
          if (isAdmin) {
            toast.success('Welcome back, Admin!');
            console.log("Navigating to /admin");
            navigate("/admin");
          } else {
            toast.success('Welcome back!');
            console.log("Navigating to /dashboard");
            navigate("/dashboard");
          }
        } catch (roleError) {
          console.error("Role check failed:", roleError);
          toast.success('Welcome back!');
          navigate("/dashboard");
        }
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      
      // Handle localStorage quota exceeded error
      if (error.name === 'QuotaExceededError' || error.message?.toLowerCase().includes('quota')) {
        // Clear localStorage to free up space (keep only Supabase auth keys)
        try {
          const keysToKeep = ['sb-fejnevxardxejdvjbipc-auth-token'];
          const allKeys = Object.keys(localStorage);
          allKeys.forEach(key => {
            if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
              localStorage.removeItem(key);
            }
          });
          
          toast.error("Storage quota exceeded", {
            description: "We've cleared old data. Please try signing in again.",
            duration: 8000,
          });
        } catch (clearError) {
          toast.error("Storage quota exceeded", {
            description: "Please clear your browser cache and try again.",
            duration: 8000,
          });
        }
      }
      // Handle invalid credentials specifically
      else if (error.message?.toLowerCase().includes('invalid login credentials') || 
          error.message?.toLowerCase().includes('invalid password') ||
          error.code === 'invalid_credentials') {
        toast.error("Incorrect email or password", {
          description: "Please check your credentials and try again, or use 'Forgot Password' to reset.",
          duration: 8000,
        });
      } else if (error.message?.toLowerCase().includes('email not confirmed')) {
        toast.error("Please verify your email", {
          description: "Check your inbox for a verification email.",
          duration: 6000,
        });
      } else {
        toast.error("Sign in failed", {
          description: error.message || "An error occurred. Please try again.",
          duration: 6000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Rate limiting
    const now = Date.now();
    if (now - lastResetAttempt < RESET_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESET_COOLDOWN_MS - (now - lastResetAttempt)) / 1000);
      toast.error(`Please wait ${remainingSeconds} seconds before trying again`);
      return;
    }

    setLoading(true);
    setLastResetAttempt(now);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast.success("Password reset email sent! Check your inbox.");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Error sending reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Check password strength
    const strength = checkPasswordStrength(newPassword);
    if (strength.strength < 3) {
      toast.error("Password is too weak", {
        description: strength.feedback.join(", "),
        duration: 5000,
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      setIsResettingPassword(false);
      setNewPassword("");
      setConfirmPassword("");
      // Clear the hash from URL
      window.history.replaceState(null, "", window.location.pathname);
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Error updating password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoFull} alt="ForSWAGs" className="h-12" />
          </div>
          
          <Button variant="ghost" onClick={() => navigate("/")} className="text-primary hover:text-primary/80 font-bold">
            Back to Home
          </Button>
        </div>
      </header>

      <div className="min-h-screen flex items-center justify-center bg-background sports-pattern p-4">
        <Card className="w-full max-w-md p-8 space-y-6 bg-card/80 backdrop-blur border-2 border-primary/20">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-tight glow-text">
              {isResettingPassword ? "Reset Password" : "Join the Team"}
            </h1>
            <p className="text-muted-foreground uppercase text-sm tracking-wider">
              {isResettingPassword 
                ? "Enter your new password" 
                : isStaffSignup 
                  ? "For Verified College Coaching Staff" 
                  : "For Students With Athletic Goals"
              }
            </p>
          </div>

        {isResettingPassword ? (
          <form onSubmit={handleUpdatePassword} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password (min 8 characters)</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full btn-hero" disabled={loading}>
              {loading ? "Updating password..." : "Update Password"}
            </Button>
          </form>
        ) : (
          <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            {!showForgotPassword ? (
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                <Button type="submit" className="w-full btn-hero" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:text-primary/80 underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <Button type="submit" className="w-full btn-hero" disabled={loading}>
                  {loading ? "Sending reset email..." : "Send Reset Email"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail("");
                    }}
                    className="text-sm text-muted-foreground hover:text-primary underline"
                  >
                    Back to sign in
                  </button>
                </div>
              </form>
            )}
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">
                  Email {isStaffSignup && <span className="text-primary">(.edu required)</span>}
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder={isStaffSignup ? "yourname@college.edu" : "your@email.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                {isStaffSignup && (
                  <p className="text-xs text-muted-foreground">
                    Must use your official college/university .edu email address
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    const newPassword = e.target.value;
                    setPassword(newPassword);
                    if (newPassword.length > 0) {
                      setPasswordStrength(checkPasswordStrength(newPassword));
                    }
                  }}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            passwordStrength.strength >= 5 ? 'bg-green-500 w-full' :
                            passwordStrength.strength >= 3 ? 'bg-yellow-500 w-3/5' :
                            'bg-red-500 w-2/5'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${
                        passwordStrength.strength >= 5 ? 'text-green-500' :
                        passwordStrength.strength >= 3 ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    
                    {passwordStrength.feedback.length > 0 && (
                      <div className="space-y-1">
                        {passwordStrength.feedback.map((tip, idx) => (
                          <p key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {tip}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-muted/50 border border-border rounded-md p-3 space-y-1">
                  <p className="text-xs font-semibold text-foreground">Strong password requirements:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li className="flex items-center gap-1">
                      {password.length >= 12 ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-muted-foreground/50" />}
                      At least 12 characters (minimum 8)
                    </li>
                    <li className="flex items-center gap-1">
                      {/[A-Z]/.test(password) ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-muted-foreground/50" />}
                      Uppercase letters (A-Z)
                    </li>
                    <li className="flex items-center gap-1">
                      {/[a-z]/.test(password) ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-muted-foreground/50" />}
                      Lowercase letters (a-z)
                    </li>
                    <li className="flex items-center gap-1">
                      {/[0-9]/.test(password) ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-muted-foreground/50" />}
                      Numbers (0-9)
                    </li>
                    <li className="flex items-center gap-1">
                      {/[^A-Za-z0-9]/.test(password) ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-muted-foreground/50" />}
                      Special characters (!@#$%^&*)
                    </li>
                  </ul>
                  <p className="text-xs text-muted-foreground italic pt-1">
                    Example: <code className="text-foreground">Tr0phy$W1nn3r!2025</code>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    required
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm leading-tight cursor-pointer"
                  >
                    I agree to the{" "}
                    <Link 
                      to="/terms" 
                      target="_blank"
                      className="text-primary hover:underline font-semibold"
                    >
                      Terms and Conditions
                    </Link>
                  </label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={privacyAccepted}
                    onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                    required
                  />
                  <label
                    htmlFor="privacy"
                    className="text-sm leading-tight cursor-pointer"
                  >
                    I agree to the{" "}
                    <Link 
                      to="/privacy" 
                      target="_blank"
                      className="text-primary hover:underline font-semibold"
                    >
                      Privacy Policy
                    </Link>
                    {" "}and understand that my athletic information will be publicly visible
                  </label>
                </div>
              </div>

              <Button type="submit" className="w-full btn-hero" disabled={loading || !termsAccepted || !privacyAccepted}>
                {loading ? "Creating account..." : "Sign Up"}
              </Button>

              {showManualContinue && (
                <Button 
                  type="button" 
                  className="w-full btn-hero mt-4" 
                  onClick={() => navigate("/onboarding")}
                >
                  Continue to Onboarding →
                </Button>
              )}
            </form>
          </TabsContent>
        </Tabs>
        )}
      </Card>
    </div>
    </>
  );
};

export default Auth;