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
import logoFull from "@/assets/forswags-logo.png";

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/onboarding");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
            user_id: authData.user.id,
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString(),
            privacy_accepted: true,
            privacy_accepted_at: new Date().toISOString(),
          } as any);

        if (profileError) {
          console.error("Error creating profile:", profileError);
          // Don't throw here, profile creation is secondary
        }
      }

      toast.success("Account created! Please check your email to verify.");
    } catch (error: any) {
      toast.error(error.message || "Error creating account");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Check if user can login (membership status)
      if (authData.user) {
        const { data: loginCheck, error: checkError } = await supabase.rpc('can_user_login', {
          p_user_id: authData.user.id
        });

        if (checkError) throw checkError;

        const loginStatus = loginCheck as unknown as { can_login: boolean; reason: string };
        
        if (!loginStatus.can_login) {
          // Sign out user immediately
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

      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error.message || "Error signing in");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
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

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
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
                  required
                />
                {isStaffSignup && (
                  <p className="text-xs text-muted-foreground">
                    Must use your official college/university .edu email address
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password (min 8 characters)</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Use 8+ characters with a mix of letters, numbers & symbols
                </p>
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