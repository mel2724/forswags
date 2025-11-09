import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Shield, ShieldAlert, ShieldCheck, Calendar, AlertTriangle, RefreshCw, XCircle } from "lucide-react";
import { format, differenceInDays, isPast, isFuture } from "date-fns";

interface ParentConsentManagerProps {
  athlete: any;
  onConsentUpdate: () => void;
}

export const ParentConsentManager = ({ athlete, onConsentUpdate }: ParentConsentManagerProps) => {
  const [loading, setLoading] = useState(false);
  
  const consentExpiresAt = athlete.consent_expires_at ? new Date(athlete.consent_expires_at) : null;
  const isConsentExpired = consentExpiresAt ? isPast(consentExpiresAt) : false;
  const daysUntilExpiration = consentExpiresAt ? differenceInDays(consentExpiresAt, new Date()) : null;
  const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration > 0 && daysUntilExpiration <= 30;

  const getConsentStatus = () => {
    if (!athlete.is_parent_verified || !athlete.public_profile_consent) {
      return { status: "not_verified", label: "Not Verified", variant: "destructive" as const, icon: ShieldAlert };
    }
    if (isConsentExpired) {
      return { status: "expired", label: "Expired", variant: "destructive" as const, icon: XCircle };
    }
    if (isExpiringSoon) {
      return { status: "expiring", label: "Expiring Soon", variant: "outline" as const, icon: AlertTriangle };
    }
    return { status: "active", label: "Active", variant: "default" as const, icon: ShieldCheck };
  };

  const consentStatus = getConsentStatus();

  const handleRevokeConsent = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("athletes")
        .update({
          public_profile_consent: false,
          visibility: "private",
        })
        .eq("id", athlete.id);

      if (error) throw error;

      // Log security event
      await supabase.rpc("log_security_event", {
        p_event_type: "parent_consent_revoked",
        p_severity: "high",
        p_description: "Parent revoked consent for minor athlete profile",
        p_metadata: {
          athlete_id: athlete.id,
          parent_email: athlete.parent_email,
        },
      });

      toast.success("Consent revoked. Profile is now private.");
      onConsentUpdate();
    } catch (error: any) {
      toast.error(error.message || "Error revoking consent");
    } finally {
      setLoading(false);
    }
  };

  const handleRenewConsent = async () => {
    setLoading(true);
    try {
      const newExpirationDate = new Date();
      newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 1);

      const { error } = await supabase
        .from("athletes")
        .update({
          public_profile_consent: true,
          visibility: "public",
          consent_expires_at: newExpirationDate.toISOString(),
          parent_verified_at: new Date().toISOString(),
        })
        .eq("id", athlete.id);

      if (error) throw error;

      // Log security event
      await supabase.rpc("log_security_event", {
        p_event_type: "parent_consent_renewed",
        p_severity: "medium",
        p_description: "Parent renewed consent for minor athlete profile",
        p_metadata: {
          athlete_id: athlete.id,
          parent_email: athlete.parent_email,
          new_expiration: newExpirationDate.toISOString(),
        },
      });

      toast.success("Consent renewed for 1 year. Profile is now public.");
      onConsentUpdate();
    } catch (error: any) {
      toast.error(error.message || "Error renewing consent");
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = consentStatus.icon;

  return (
    <Card className="bg-muted/30 border-2">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${
                consentStatus.status === 'expiring' ? 'text-orange-500' : 
                consentStatus.status === 'expired' || consentStatus.status === 'not_verified' ? 'text-destructive' : 
                'text-primary'
              }`} />
              <span className="font-bold">Parental Consent</span>
            </div>
            <Badge 
              variant={consentStatus.variant} 
              className={`uppercase font-bold ${
                consentStatus.status === 'expiring' ? 'border-orange-500 text-orange-500' : ''
              }`}
            >
              {consentStatus.label}
            </Badge>
          </div>

          {/* Consent Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Profile Visibility:</span>
              <Badge variant={athlete.visibility === "public" ? "default" : "secondary"}>
                {athlete.visibility === "public" ? "Public" : "Private"}
              </Badge>
            </div>

            {consentExpiresAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expires:</span>
                <span className="font-semibold flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(consentExpiresAt, "MMM d, yyyy")}
                </span>
              </div>
            )}

            {daysUntilExpiration !== null && !isConsentExpired && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Days Remaining:</span>
                <span className={`font-semibold ${isExpiringSoon ? "text-orange-500" : ""}`}>
                  {daysUntilExpiration} days
                </span>
              </div>
            )}

            {athlete.parent_verified_at && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Verified:</span>
                <span className="text-xs">
                  {format(new Date(athlete.parent_verified_at), "MMM d, yyyy")}
                </span>
              </div>
            )}
          </div>

          {/* Warning Message */}
          {isExpiringSoon && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-orange-500 mb-1">Consent Expiring Soon</p>
                  <p className="text-muted-foreground">
                    Renew consent to keep the profile public and visible to recruiters.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isConsentExpired && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-destructive mb-1">Consent Expired</p>
                  <p className="text-muted-foreground">
                    Profile has been set to private. Renew consent to make it public again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {(athlete.is_parent_verified && athlete.public_profile_consent) && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={loading} className="flex-1">
                      <XCircle className="h-4 w-4 mr-2" />
                      Revoke Consent
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke Parental Consent?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will immediately set the profile to private and prevent college recruiters 
                        from viewing it. You can renew consent at any time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRevokeConsent}>
                        Revoke Consent
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {(isExpiringSoon || isConsentExpired) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" disabled={loading} className="flex-1">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Renew Consent
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Renew Parental Consent?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will extend the consent for another year and set the profile to public, 
                          allowing college recruiters to view it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRenewConsent}>
                          Renew for 1 Year
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}

            {!athlete.is_parent_verified && (
              <div className="w-full text-center text-sm text-muted-foreground">
                <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p>Verification required before consent can be managed</p>
              </div>
            )}
          </div>

          {/* COPPA Notice */}
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <p className="flex items-start gap-1">
              <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>
                As required by COPPA, parental consent is needed for minors under 18. 
                You may revoke consent at any time.
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
