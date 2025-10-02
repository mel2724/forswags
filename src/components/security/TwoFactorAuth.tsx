import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, ShieldCheck, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import QRCode from "qrcode";

export function TwoFactorAuth() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const totpFactor = data?.totp?.find(f => f.status === 'verified');
      setMfaEnabled(!!totpFactor);
    } catch (error) {
      console.error("Error checking MFA status:", error);
    }
  };

  const enrollMFA = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) throw error;

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(data.totp.uri);
      setQrCode(qrCodeUrl);

      toast({
        title: "Scan QR Code",
        description: "Use your authenticator app to scan the QR code",
      });
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

  const verifyAndEnable = async () => {
    try {
      setLoading(true);
      
      const factors = await supabase.auth.mfa.listFactors();
      const factor = factors.data?.totp?.[0];
      
      if (!factor) throw new Error("No factor found");

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code: verifyCode,
      });

      if (error) throw error;

      // Generate backup codes
      const codes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );
      setBackupCodes(codes);

      await logAction({
        action: "mfa_enabled",
        resourceType: "user_security",
      });

      setMfaEnabled(true);
      setQrCode("");
      setVerifyCode("");

      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been enabled successfully",
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disableMFA = async () => {
    try {
      setLoading(true);
      
      const { data } = await supabase.auth.mfa.listFactors();
      const factor = data?.totp?.[0];
      
      if (!factor) throw new Error("No factor found");

      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });

      if (error) throw error;

      await logAction({
        action: "mfa_disabled",
        resourceType: "user_security",
      });

      setMfaEnabled(false);
      setBackupCodes([]);

      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled",
      });
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

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Copied",
      description: "Backup codes copied to clipboard",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mfaEnabled ? <ShieldCheck className="h-5 w-5 text-primary" /> : <Shield className="h-5 w-5" />}
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mfaEnabled ? (
          <>
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is currently <strong>enabled</strong> for your account.
              </AlertDescription>
            </Alert>

            {backupCodes.length > 0 && (
              <div className="space-y-2">
                <Label>Backup Codes (Save These!)</Label>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  {backupCodes.map((code, i) => (
                    <div key={i} className="font-mono text-sm">
                      {code}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyBackupCodes}
                  className="w-full"
                >
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copied!" : "Copy All Codes"}
                </Button>
              </div>
            )}

            <Button
              variant="destructive"
              onClick={disableMFA}
              disabled={loading}
              className="w-full"
            >
              Disable Two-Factor Authentication
            </Button>
          </>
        ) : (
          <>
            {qrCode ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="verify-code">Verification Code</Label>
                  <Input
                    id="verify-code"
                    placeholder="Enter 6-digit code"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={verifyAndEnable}
                    disabled={loading || verifyCode.length !== 6}
                    className="flex-1"
                  >
                    Verify & Enable
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQrCode("");
                      setVerifyCode("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Two-factor authentication is currently <strong>disabled</strong>.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>When enabled, you'll need:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your password</li>
                    <li>A code from your authenticator app</li>
                  </ul>
                </div>

                <Button
                  onClick={enrollMFA}
                  disabled={loading}
                  className="w-full"
                >
                  Enable Two-Factor Authentication
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
